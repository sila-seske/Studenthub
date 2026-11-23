-- migration-v7-materials-storage.sql
-- Course files are stored in the private "course-files" bucket in Supabase Storage.
-- Only the "materials" Edge Function (which uses the service role) reads or writes them,
-- so the direct storage rules are removed. Students download through short-lived links.

update storage.buckets
set file_size_limit = 26214400,
    allowed_mime_types = array[
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
    ]
where id = 'course-files';

drop policy if exists "course files: approved lecturers upload" on storage.objects;
drop policy if exists "course files: owners delete" on storage.objects;
drop policy if exists "course files: signed-in read" on storage.objects;
