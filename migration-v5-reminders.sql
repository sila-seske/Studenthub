-- migration-v5-reminders.sql
-- Class, exam and task reminders sent from the server, so they arrive when the app is closed.
-- Run once in the SQL Editor (or it is applied through the Supabase connection).

create extension if not exists pg_cron with schema pg_catalog;

-- 1. Allow the "reminder" kind in the notifications table.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.notifications'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%kind%'
  loop
    execute format('alter table public.notifications drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('request', 'accepted', 'message', 'reminder'));

-- 2. Upcoming reminder times, one row per class, exam or task occurrence.
create table if not exists public.reminder_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ref text not null check (char_length(ref) <= 120),
  kind text not null default 'reminder' check (char_length(kind) <= 20),
  title text not null check (char_length(title) <= 120),
  body text not null check (char_length(body) <= 200),
  link text check (link is null or char_length(link) <= 64),
  fire_at timestamptz not null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, ref)
);
create index if not exists reminder_items_due on public.reminder_items (fire_at) where sent_at is null;

alter table public.reminder_items enable row level security;
drop policy if exists "reminders read own" on public.reminder_items;
create policy "reminders read own" on public.reminder_items
  for select to authenticated using (user_id = auth.uid());
-- No insert, update or delete policy: students change reminders only through sync_reminders().

-- 3. The app calls this whenever the student's classes, exams or tasks change.
create or replace function public.sync_reminders(items jsonb)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  n integer := 0;
begin
  if uid is null then raise exception 'Sign in first'; end if;
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) > 300 then
    raise exception 'Too many reminders';
  end if;

  -- Remove reminders that are no longer wanted (not yet sent).
  delete from reminder_items r
  where r.user_id = uid and r.sent_at is null
    and r.ref not in (select i->>'ref' from jsonb_array_elements(items) i);

  -- Add or update the rest. Reminders already sent are left alone, so nothing repeats.
  insert into reminder_items (user_id, ref, title, body, link, fire_at)
  select uid,
         left(i->>'ref', 120),
         left(i->>'title', 120),
         left(i->>'body', 200),
         left(i->>'link', 64),
         (i->>'fire_at')::timestamptz
  from jsonb_array_elements(items) i
  where (i->>'fire_at')::timestamptz > now() - interval '5 minutes'
  on conflict (user_id, ref) do update
    set title = excluded.title, body = excluded.body, fire_at = excluded.fire_at
    where reminder_items.sent_at is null;

  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.sync_reminders(jsonb) from public, anon;
grant execute on function public.sync_reminders(jsonb) to authenticated;

-- 4. Turns every due reminder into a notification. The existing webhook then sends the push.
create or replace function public.deliver_reminders()
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  n integer := 0;
begin
  with due as (
    update reminder_items set sent_at = now()
    where sent_at is null and fire_at <= now() and fire_at > now() - interval '1 day'
    returning user_id, title, body, link
  ), ins as (
    insert into notifications (user_id, kind, title, body, link)
    select user_id, 'reminder', title, body, link from due
    returning 1
  )
  select count(*) into n from ins;
  return n;
end $$;
revoke all on function public.deliver_reminders() from public, anon, authenticated;

-- 5. Run the delivery every minute.
do $$ begin perform cron.unschedule('deliver-reminders'); exception when others then null; end $$;
select cron.schedule('deliver-reminders', '* * * * *', $$select public.deliver_reminders()$$);
