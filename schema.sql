-- StudentHub database schema for Supabase (PostgreSQL)
-- Run once on a new project: Supabase dashboard > SQL Editor > New query > paste > Run.
--
-- Every student's rows are protected by Row Level Security (RLS). A signed-in student can only
-- read and write rows that belong to them. The anon key in the app is public by design, so RLS
-- is what protects the data. Never put the service_role key in the app.
--
-- Record IDs are UUIDs made on the device (crypto.randomUUID), so a student can create data
-- offline and sync it later. Deletions are soft (deleted_at), so other devices learn about them.

-- ---------- Shared helper: keep updated_at current ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- Private profile: one row per account ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('student', 'lecturer')),
  budget numeric(12,2) not null default 0 check (budget >= 0),
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  study_time text not null default 'Evening' check (char_length(study_time) <= 20),
  study_session_minutes int not null default 60 check (study_session_minutes between 15 and 240),
  sessions_per_day int not null default 1 check (sessions_per_day between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------- Public profile: only what a student chooses to show ----------
create table if not exists public.public_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 40),
  university text not null default '' check (char_length(university) <= 80),
  department text not null default '' check (char_length(department) <= 80),
  interests text[] not null default '{}' check (cardinality(interests) <= 10),
  discoverable boolean not null default false,
  updated_at timestamptz not null default now()
);
drop trigger if exists public_profiles_touch on public.public_profiles;
create trigger public_profiles_touch before update on public.public_profiles
  for each row execute function public.touch_updated_at();

-- Creates both profile rows whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.public_profiles (id, display_name)
  values (new.id, coalesce(left(new.raw_user_meta_data->>'name', 40), ''));
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Student data (synced) ----------
create table if not exists public.classes (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  course text not null check (char_length(course) <= 60),
  day text not null check (day in ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  start_time text not null check (start_time ~ '^[0-9]{2}:[0-9]{2}$'),
  end_time text not null check (end_time ~ '^[0-9]{2}:[0-9]{2}$'),
  room text not null default '' check (char_length(room) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.exams (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null default '' check (char_length(code) <= 20),
  title text not null check (char_length(title) <= 60),
  exam_date date not null,
  exam_time text check (exam_time is null or exam_time ~ '^[0-9]{2}:[0-9]{2}$'),
  venue text not null default '' check (char_length(venue) <= 60),
  notes text not null default '' check (char_length(notes) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.expenses (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) <= 60),
  amount numeric(12,2) not null check (amount > 0),
  category text not null check (char_length(category) <= 40),
  spent_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.notes (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '' check (char_length(title) <= 120),
  body text not null default '' check (char_length(body) <= 50000),
  course text not null default '' check (char_length(course) <= 60),
  colour smallint not null default 0 check (colour between 0 and 3),
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.gpa_rows (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  course text not null default '' check (char_length(course) <= 60),
  units smallint not null check (units between 1 and 12),
  grade text not null check (grade in ('A','B','C','D','E','F')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.materials (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) <= 80),
  course text not null default '' check (char_length(course) <= 40),
  body text not null check (char_length(body) <= 2000),
  shared_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ---------- Connections, blocks and reports (people discovery) ----------
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);
drop trigger if exists connections_touch on public.connections;
create trigger connections_touch before update on public.connections
  for each row execute function public.touch_updated_at();

create table if not exists public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) <= 500),
  created_at timestamptz not null default now()
);

-- ---------- Indexes for sync: fetch what changed since the last sync ----------
do $$
declare t text;
begin
  foreach t in array array['classes','exams','expenses','notes','gpa_rows','materials'] loop
    execute format('create index if not exists %I on public.%I (user_id, updated_at)', t || '_sync_idx', t);
  end loop;
end $$;

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
drop policy if exists "profiles: own row" on public.profiles;
create policy "profiles: own row" on public.profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

alter table public.public_profiles enable row level security;
drop policy if exists "public profiles: read discoverable or own" on public.public_profiles;
create policy "public profiles: read discoverable or own" on public.public_profiles
  for select to authenticated using (discoverable or id = auth.uid());
drop policy if exists "public profiles: write own" on public.public_profiles;
create policy "public profiles: write own" on public.public_profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Each student's own rows, in every synced table.
do $$
declare t text;
begin
  foreach t in array array['classes','exams','expenses','notes','gpa_rows','materials'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || ': own rows', t);
    execute format('create policy %I on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t || ': own rows', t);
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()', t || '_touch', t);
  end loop;
end $$;

alter table public.connections enable row level security;
drop policy if exists "connections: see own" on public.connections;
create policy "connections: see own" on public.connections
  for select to authenticated using (requester_id = auth.uid() or addressee_id = auth.uid());
drop policy if exists "connections: send as self" on public.connections;
create policy "connections: send as self" on public.connections
  for insert to authenticated with check (requester_id = auth.uid());
drop policy if exists "connections: addressee answers" on public.connections;
create policy "connections: addressee answers" on public.connections
  for update to authenticated using (addressee_id = auth.uid()) with check (addressee_id = auth.uid());
drop policy if exists "connections: either side removes" on public.connections;
create policy "connections: either side removes" on public.connections
  for delete to authenticated using (requester_id = auth.uid() or addressee_id = auth.uid());

alter table public.blocks enable row level security;
drop policy if exists "blocks: own" on public.blocks;
create policy "blocks: own" on public.blocks
  for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- Students can file reports but cannot read them. Reports are reviewed in the dashboard.
alter table public.reports enable row level security;
drop policy if exists "reports: file as self" on public.reports;
create policy "reports: file as self" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());

-- ---------- Functions the app calls ----------

-- Students who chose to be discoverable, excluding anyone blocked in either direction.
create or replace function public.discover_students(max_results int default 20)
returns setof public.public_profiles
language sql stable security definer set search_path = public as $$
  select p.* from public.public_profiles p
  where p.discoverable
    and p.id <> auth.uid()
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
         or (b.blocker_id = p.id and b.blocked_id = auth.uid())
    )
  order by random()
  limit least(greatest(max_results, 1), 50)
$$;
revoke all on function public.discover_students(int) from public;
grant execute on function public.discover_students(int) to authenticated;

-- Deletes the signed-in student's account. Every related row is removed by the cascades above.
create or replace function public.delete_my_account()
returns void
language sql security definer set search_path = public as $$
  delete from auth.users where id = auth.uid();
$$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
