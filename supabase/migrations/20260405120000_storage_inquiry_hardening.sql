-- SÅGÊ Digital — Stage 10.3 storage + inquiry submission hardening
-- Apply manually in the Supabase SQL editor or via the Supabase CLI.
-- Do not apply automatically from the frontend.
--
-- Changes:
-- 1. Restrict portfolio-media writes to objects under library/ (admin-only via is_admin()).
-- 2. Reaffirm bucket MIME allow-list (no SVG) and 5 MB size limit.
-- 3. Move public inquiry inserts behind the submit-inquiry Edge Function (service role).
-- 4. Add inquiry_submission_throttle for server-side rate limiting (service role only).
--
-- Prerequisites:
-- - 20260401120000_portfolio_media_storage.sql
-- - 20260402120000_create_inquiries.sql
-- - 20260404120000_auth_rls_hardening.sql
-- Deploy supabase/functions/submit-inquiry after applying this migration.

-- ---------------------------------------------------------------------------
-- Storage bucket hardening (no SVG; size + MIME enforced by Storage)
-- ---------------------------------------------------------------------------
update storage.buckets
set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'portfolio-media';

-- Public read retained for portfolio image URLs (listing residual risk documented in setup).
drop policy if exists "Public can read portfolio media" on storage.objects;
create policy "Public can read portfolio media"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'portfolio-media');

-- Writes restricted to library/* + admin claim
drop policy if exists "Admins can upload portfolio media" on storage.objects;
create policy "Admins can upload portfolio media"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'portfolio-media'
    and name like 'library/%'
    and public.is_admin()
  );

drop policy if exists "Admins can update portfolio media" on storage.objects;
create policy "Admins can update portfolio media"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'portfolio-media'
    and name like 'library/%'
    and public.is_admin()
  )
  with check (
    bucket_id = 'portfolio-media'
    and name like 'library/%'
    and public.is_admin()
  );

drop policy if exists "Admins can delete portfolio media" on storage.objects;
create policy "Admins can delete portfolio media"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'portfolio-media'
    and name like 'library/%'
    and public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- Inquiry throttle table (Edge Function / service_role only)
-- ---------------------------------------------------------------------------
create table if not exists public.inquiry_submission_throttle (
  bucket_key text primary key,
  window_started_at timestamptz not null default now(),
  hit_count integer not null default 0,
  constraint inquiry_submission_throttle_hit_count_nonnegative check (hit_count >= 0)
);

alter table public.inquiry_submission_throttle enable row level security;
alter table public.inquiry_submission_throttle force row level security;

revoke all on table public.inquiry_submission_throttle from anon, authenticated;
-- No policies for anon/authenticated → denied. service_role bypasses RLS.

-- ---------------------------------------------------------------------------
-- Close direct public INSERT on inquiries (Edge Function inserts with service role)
-- ---------------------------------------------------------------------------
revoke insert on table public.inquiries from anon, authenticated;

drop policy if exists "Public can submit inquiries" on public.inquiries;

-- Admin read/update/delete unchanged
drop policy if exists "Admins can select inquiries" on public.inquiries;
create policy "Admins can select inquiries"
  on public.inquiries
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update inquiries" on public.inquiries;
create policy "Admins can update inquiries"
  on public.inquiries
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete inquiries" on public.inquiries;
create policy "Admins can delete inquiries"
  on public.inquiries
  for delete
  to authenticated
  using (public.is_admin());

-- Keep SELECT/UPDATE/DELETE grants for authenticated (RLS still requires is_admin())
grant select, update, delete on table public.inquiries to authenticated;
