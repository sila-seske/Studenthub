-- StudentHub migration v3: notifications for requests, accepted requests and messages.
-- Run once in the Supabase SQL Editor, after migration-v2.sql.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('request', 'accepted', 'message')),
  title text not null check (char_length(title) <= 120),
  body text not null default '' check (char_length(body) <= 200),
  link text check (link is null or char_length(link) <= 64),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists notifications_user_time on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;

-- Students can read and clear only their own notifications. Only the database creates them.
drop policy if exists "notifications: read own" on public.notifications;
create policy "notifications: read own" on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists "notifications: mark own read" on public.notifications;
create policy "notifications: mark own read" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "notifications: delete own" on public.notifications;
create policy "notifications: delete own" on public.notifications for delete to authenticated using (user_id = auth.uid());
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

create or replace function public.display_name_of(p_user uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(display_name, ''), 'A student') from public.public_profiles where id = p_user;
$$;
revoke all on function public.display_name_of(uuid) from public, anon, authenticated;

-- A new connection request notifies the student it was sent to.
create or replace function public.notify_on_request() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'pending' then
    insert into public.notifications (user_id, kind, title, body, link)
    values (new.addressee_id, 'request', 'New connection request', public.display_name_of(new.requester_id) || ' wants to connect with you', new.requester_id::text);
  end if;
  return new;
end $$;
drop trigger if exists connections_notify_request on public.connections;
create trigger connections_notify_request after insert on public.connections
  for each row execute function public.notify_on_request();

-- When a request is accepted, the student who sent it is told.
create or replace function public.notify_on_accept() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    insert into public.notifications (user_id, kind, title, body, link)
    values (new.requester_id, 'accepted', 'Request accepted', public.display_name_of(new.addressee_id) || ' accepted your request. You can message them now.', new.addressee_id::text);
  end if;
  return new;
end $$;
drop trigger if exists connections_notify_accept on public.connections;
create trigger connections_notify_accept after update on public.connections
  for each row execute function public.notify_on_accept();

-- A new message notifies the recipient once per sender until they read it. The message text is never included.
create or replace function public.notify_on_message() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.notifications n
                 where n.user_id = new.recipient_id and n.kind = 'message'
                   and n.link = new.sender_id::text and n.read_at is null) then
    insert into public.notifications (user_id, kind, title, body, link)
    values (new.recipient_id, 'message', 'New message', public.display_name_of(new.sender_id) || ' sent you a message', new.sender_id::text);
  end if;
  return new;
end $$;
drop trigger if exists messages_notify on public.messages;
create trigger messages_notify after insert on public.messages
  for each row execute function public.notify_on_message();

-- Live delivery: the app listens for new notifications for the signed-in student.
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;
