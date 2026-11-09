-- StudentHub security tests. Run in the SQL Editor AFTER migration-v2.sql.
-- Create two test accounts (Authentication > Users > Add user), then paste their ids below.
-- If any check fails, the script stops with a FAIL message. Run it again after every migration.
do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';  -- test student A (replace)
  b uuid := '00000000-0000-0000-0000-00000000000b';  -- test student B (replace)
  n int; blocked boolean;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- 1. A cannot read B's profile or classes
  select count(*) into n from public.profiles where id = b;
  if n <> 0 then raise exception 'FAIL 1a: A can read B profile'; end if;
  select count(*) into n from public.classes where user_id = b;
  if n <> 0 then raise exception 'FAIL 1b: A can read B classes'; end if;

  -- 2. A cannot make themselves a lecturer or an admin
  blocked := false;
  begin update public.profiles set role = 'lecturer', lecturer_approved = true where id = a;
  exception when others then blocked := true; end;
  if not blocked then raise exception 'FAIL 2: A changed their own role'; end if;

  -- 3. A cannot upload shared materials without approval
  blocked := false;
  begin insert into public.shared_materials (uploader_id, title, kind, body)
        values (a, 'test', 'note', 'test');
  exception when others then blocked := true; end;
  if not blocked then raise exception 'FAIL 3: a student added course material'; end if;

  -- 4. A cannot message B without an accepted connection
  blocked := false;
  begin insert into public.messages (sender_id, recipient_id, body) values (a, b, 'hello');
  exception when others then blocked := true; end;
  if not blocked then raise exception 'FAIL 4: message sent without a connection'; end if;

  -- 5. A cannot read messages between B and someone else
  select count(*) into n from public.messages where sender_id = b or recipient_id = b;
  if n <> 0 then raise exception 'FAIL 5: A can read B messages'; end if;

  -- 6. A cannot read the reports file
  select count(*) into n from public.reports;
  if n <> 0 then raise exception 'FAIL 6: A can read reports'; end if;

  reset role;
  raise notice 'All StudentHub security checks passed.';
end $$;
