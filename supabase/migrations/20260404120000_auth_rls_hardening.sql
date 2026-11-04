-- SÅGÊ Digital — Stage 10.2 authentication & RLS hardening
-- Apply manually in the Supabase SQL editor or via the Supabase CLI.
-- Do not apply automatically from the frontend.
--
-- Goals (idempotent; does not weaken existing policies):
-- 1. Harden public.is_admin() to read ONLY JWT app_metadata.role (never user_metadata).
-- 2. Lock function execute privileges (authenticated only).
-- 3. Reaffirm table privileges: anon cannot write projects/services/settings;
--    anon cannot read/update/delete inquiries.
-- 4. Reaffirm Storage write policies require is_admin(); drop known-permissive aliases.
--
-- Prerequisite: earlier Stage 9 migrations (is_admin, tables, storage bucket).

-- ---------------------------------------------------------------------------
-- 1) Trusted admin claim helper
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  -- Intentionally ignore auth.jwt() -> 'user_metadata'.
  -- End users can edit user_metadata via auth.updateUser; they cannot edit app_metadata.
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
revoke all on function public.is_admin() from authenticated;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Table privileges (API roles) — RLS remains the authorization boundary
-- ---------------------------------------------------------------------------
revoke all on table public.projects from anon, authenticated;
revoke all on table public.services from anon, authenticated;
revoke all on table public.inquiries from anon, authenticated;
revoke all on table public.site_settings from anon, authenticated;

-- Published content + public settings: read for visitors
grant select on table public.projects to anon, authenticated;
grant select on table public.services to anon, authenticated;
grant select on table public.site_settings to anon, authenticated;

-- Contact form: insert only (status constrained by RLS)
grant insert on table public.inquiries to anon, authenticated;

-- Authenticated may attempt admin writes; RLS + is_admin() must still pass
grant insert, update, delete on table public.projects to authenticated;
grant insert, update, delete on table public.services to authenticated;
grant select, update, delete on table public.inquiries to authenticated;
grant insert, update, delete on table public.site_settings to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Reaffirm content RLS (published public read; admin CRUD)
-- ---------------------------------------------------------------------------
alter table public.projects enable row level security;
alter table public.services enable row level security;
alter table public.inquiries enable row level security;
alter table public.site_settings enable row level security;
alter table public.projects force row level security;
alter table public.services force row level security;
alter table public.inquiries force row level security;
alter table public.site_settings force row level security;

drop policy if exists "Public can read published projects" on public.projects;
create policy "Public can read published projects"
  on public.projects
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Admins can select all projects" on public.projects;
create policy "Admins can select all projects"
  on public.projects
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can insert projects" on public.projects;
create policy "Admins can insert projects"
  on public.projects
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update projects" on public.projects;
create policy "Admins can update projects"
  on public.projects
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete projects" on public.projects;
create policy "Admins can delete projects"
  on public.projects
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "Public can read published services" on public.services;
create policy "Public can read published services"
  on public.services
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Admins can select all services" on public.services;
create policy "Admins can select all services"
  on public.services
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can insert services" on public.services;
create policy "Admins can insert services"
  on public.services
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update services" on public.services;
create policy "Admins can update services"
  on public.services
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete services" on public.services;
create policy "Admins can delete services"
  on public.services
  for delete
  to authenticated
  using (public.is_admin());

-- Inquiries: public INSERT (new only); admin SELECT/UPDATE/DELETE; no public read
drop policy if exists "Public can submit inquiries" on public.inquiries;
create policy "Public can submit inquiries"
  on public.inquiries
  for insert
  to anon, authenticated
  with check (status = 'new');

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

-- Site settings: public SELECT; admin writes
drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert site settings" on public.site_settings;
create policy "Admins can insert site settings"
  on public.site_settings
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update site settings" on public.site_settings;
create policy "Admins can update site settings"
  on public.site_settings
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete site settings" on public.site_settings;
create policy "Admins can delete site settings"
  on public.site_settings
  for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4) Storage: reassert portfolio-media policies only (do not drop unrelated
-- storage.objects policies that may belong to other buckets).
-- ---------------------------------------------------------------------------
drop policy if exists "Public can read portfolio media" on storage.objects;
create policy "Public can read portfolio media"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'portfolio-media');

drop policy if exists "Admins can upload portfolio media" on storage.objects;
create policy "Admins can upload portfolio media"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'portfolio-media'
    and public.is_admin()
  );

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

drop policy if exists "Admins can delete portfolio media" on storage.objects;
create policy "Admins can delete portfolio media"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'portfolio-media'
    and public.is_admin()
  );
