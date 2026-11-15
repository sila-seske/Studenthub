-- migration-v6-course-materials.sql
-- Lecturer course materials. Files live in Cloudflare R2; this table holds the details students search.

create table if not exists public.course_materials (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  course text not null check (char_length(course) between 2 and 40),
  description text check (description is null or char_length(description) <= 500),
  file_name text not null check (char_length(file_name) between 1 and 160),
  file_key text not null unique check (char_length(file_key) <= 300),
  mime_type text not null check (mime_type in (
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/png',
    'image/jpeg'
  )),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 26214400),
  status text not null default 'pending' check (status in ('pending', 'ready', 'removed')),
  search tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(course, '') || ' ' || coalesce(description, '') || ' ' || coalesce(file_name, ''))
  ) stored,
  created_at timestamptz not null default now(),
  ready_at timestamptz
);

create index if not exists course_materials_search on public.course_materials using gin (search);
create index if not exists course_materials_ready on public.course_materials (status, created_at desc);

alter table public.course_materials enable row level security;
drop policy if exists "materials read ready or own" on public.course_materials;
create policy "materials read ready or own" on public.course_materials
  for select to authenticated
  using (status = 'ready' or uploader_id = auth.uid());
-- No insert, update or delete policy: uploads go through the "materials" Edge Function,
-- which checks that the user is an approved lecturer before writing.

-- Search for students. Runs as the caller, so the row policy above still applies.
create or replace function public.search_materials(q text default null, course_filter text default null)
returns table (
  id uuid, title text, course text, description text, file_name text,
  mime_type text, size_bytes integer, uploader_name text, created_at timestamptz
)
language sql stable security invoker set search_path = public
as $$
  select m.id, m.title, m.course, m.description, m.file_name, m.mime_type, m.size_bytes,
         coalesce(p.display_name, 'Lecturer') as uploader_name, m.created_at
  from course_materials m
  left join public_profiles p on p.id = m.uploader_id
  where m.status = 'ready'
    and (nullif(btrim(course_filter), '') is null or m.course ilike btrim(course_filter))
    and (
      nullif(btrim(q), '') is null
      or m.search @@ websearch_to_tsquery('simple', btrim(q))
      or m.title ilike '%' || btrim(q) || '%'
      or m.course ilike '%' || btrim(q) || '%'
      or m.file_name ilike '%' || btrim(q) || '%'
    )
  order by
    case when nullif(btrim(q), '') is null then 0
         else ts_rank(m.search, websearch_to_tsquery('simple', btrim(q))) end desc,
    m.created_at desc
  limit 50;
$$;
grant execute on function public.search_materials(text, text) to authenticated;
