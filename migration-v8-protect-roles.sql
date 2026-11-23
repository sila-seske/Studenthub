-- migration-v8-protect-roles.sql
-- Stops students from changing their own role or approving themselves as lecturers.
-- Users can still edit their name and other profile details. Only the Supabase dashboard
-- or the SQL editor (service role) can set role and lecturer_approved.

revoke update (role, lecturer_approved) on public.profiles from authenticated, anon;
revoke insert (role, lecturer_approved) on public.profiles from authenticated, anon;
