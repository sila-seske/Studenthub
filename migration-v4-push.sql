-- StudentHub migration v4: web push subscriptions (alerts when the app is closed).
-- Run once in the Supabase SQL Editor, after migration-v3-notifications.sql.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) <= 2000),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;

-- Students can see and remove only their own devices. Devices are added through register_push.
drop policy if exists "push: read own devices" on public.push_subscriptions;
create policy "push: read own devices" on public.push_subscriptions for select to authenticated using (user_id = auth.uid());

-- A device belongs to whoever is signed in on it. Registering replaces any earlier owner of that device.
create or replace function public.register_push(p_endpoint text, p_p256dh text, p_auth text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  perform public.check_rate(auth.uid(), 'push_register', 30, 3600);
  delete from public.push_subscriptions where endpoint = p_endpoint;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values (auth.uid(), p_endpoint, p_p256dh, p_auth);
end $$;
revoke all on function public.register_push(text, text, text) from public, anon;
grant execute on function public.register_push(text, text, text) to authenticated;

create or replace function public.unregister_push(p_endpoint text) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.push_subscriptions where endpoint = p_endpoint and user_id = auth.uid();
end $$;
revoke all on function public.unregister_push(text) from public, anon;
grant execute on function public.unregister_push(text) to authenticated;
