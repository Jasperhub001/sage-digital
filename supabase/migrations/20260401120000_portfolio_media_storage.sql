-- SÅGÊ Digital — Stage 9.5 portfolio media storage
-- Apply manually in the Supabase SQL editor or via the Supabase CLI.
-- Do not apply automatically from the frontend.
--
-- SECURITY:
-- - Bucket is public for portfolio image delivery (SELECT/read).
-- - INSERT / UPDATE / DELETE require authenticated admin via public.is_admin()
--   (JWT app_metadata.role = 'admin').
-- - Never put service_role keys in the Vite frontend.
--
-- Prerequisite: public.is_admin() from 20260331120000_admin_content_policies.sql

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media',
  'portfolio-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public can read objects (portfolio visitors need image URLs)
drop policy if exists "Public can read portfolio media" on storage.objects;
create policy "Public can read portfolio media"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'portfolio-media');

-- Admins can upload
drop policy if exists "Admins can upload portfolio media" on storage.objects;
create policy "Admins can upload portfolio media"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'portfolio-media'
    and public.is_admin()
  );

-- Admins can update/replace objects
drop policy if exists "Admins can update portfolio media" on storage.objects;
create policy "Admins can update portfolio media"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'portfolio-media'
    and public.is_admin()
  )
  with check (
    bucket_id = 'portfolio-media'
    and public.is_admin()
  );

-- Admins can delete
drop policy if exists "Admins can delete portfolio media" on storage.objects;
create policy "Admins can delete portfolio media"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'portfolio-media'
    and public.is_admin()
  );
