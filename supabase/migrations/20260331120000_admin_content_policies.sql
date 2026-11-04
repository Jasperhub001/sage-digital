-- SÅGÊ Digital — Stage 9.1 administrator RLS policies
-- Apply manually in the Supabase SQL editor or via the Supabase CLI.
-- Do not apply automatically from the frontend.
--
-- SECURITY:
-- - Public SELECT for published rows is preserved.
-- - Admin CRUD is gated by JWT app_metadata.role = 'admin' (server-managed).
-- - Never trust user_metadata for authorization.
-- - anon remains SELECT-only (published via RLS).
-- - Never put service_role keys in the Vite frontend.

-- Trusted admin claim helper (reads JWT app_metadata only)
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Table privileges: authenticated may attempt writes; RLS still enforces admin-only.
-- anon stays read-only at the privilege layer.
revoke all on table public.projects from anon, authenticated;
revoke all on table public.services from anon, authenticated;

grant select on table public.projects to anon;
grant select on table public.services to anon;

grant select, insert, update, delete on table public.projects to authenticated;
grant select, insert, update, delete on table public.services to authenticated;

-- Preserve public published reads
drop policy if exists "Public can read published projects" on public.projects;
create policy "Public can read published projects"
  on public.projects
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Public can read published services" on public.services;
create policy "Public can read published services"
  on public.services
  for select
  to anon, authenticated
  using (status = 'published');

-- Projects: administrator policies
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

-- Services: administrator policies
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
