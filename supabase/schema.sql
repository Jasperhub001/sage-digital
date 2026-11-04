-- Canonical schema for SÅGÊ Digital content tables.
-- Prefer running the versioned migration file directly in the SQL editor:
--   supabase/migrations/20260330120000_create_projects_and_services.sql
--
-- This file mirrors that migration for convenience.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'content_status'
      and n.nspname = 'public'
  ) then
    create type public.content_status as enum ('draft', 'published');
  end if;
end
$$;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  icon text,
  features text[] not null default '{}',
  display_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_slug_not_blank check (length(trim(slug)) > 0),
  constraint services_title_not_blank check (length(trim(title)) > 0)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  category text not null,
  technologies text[] not null default '{}',
  cover_image text not null,
  gallery_images text[] not null default '{}',
  live_url text,
  github_url text,
  featured boolean not null default false,
  display_order integer not null default 0,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_slug_not_blank check (length(trim(slug)) > 0),
  constraint projects_title_not_blank check (length(trim(title)) > 0),
  constraint projects_cover_image_not_blank check (length(trim(cover_image)) > 0)
);

create index if not exists services_published_order_idx
  on public.services (display_order)
  where status = 'published';

create index if not exists services_status_idx
  on public.services (status);

create index if not exists projects_published_order_idx
  on public.projects (display_order, featured desc)
  where status = 'published';

create index if not exists projects_status_idx
  on public.projects (status);

create index if not exists projects_slug_idx
  on public.projects (slug);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
before update on public.services
for each row
execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

alter table public.services enable row level security;
alter table public.projects enable row level security;
alter table public.services force row level security;
alter table public.projects force row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  -- Ignore user_metadata; only server-managed app_metadata.role grants admin.
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

revoke all on table public.services from anon, authenticated;
revoke all on table public.projects from anon, authenticated;

grant select on table public.services to anon;
grant select on table public.projects to anon;
grant select, insert, update, delete on table public.services to authenticated;
grant select, insert, update, delete on table public.projects to authenticated;

drop policy if exists "Public can read published services" on public.services;
create policy "Public can read published services"
  on public.services
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Public can read published projects" on public.projects;
create policy "Public can read published projects"
  on public.projects
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Admins can select all projects" on public.projects;
create policy "Admins can select all projects"
  on public.projects for select to authenticated
  using (public.is_admin());

drop policy if exists "Admins can insert projects" on public.projects;
create policy "Admins can insert projects"
  on public.projects for insert to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update projects" on public.projects;
create policy "Admins can update projects"
  on public.projects for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete projects" on public.projects;
create policy "Admins can delete projects"
  on public.projects for delete to authenticated
  using (public.is_admin());

drop policy if exists "Admins can select all services" on public.services;
create policy "Admins can select all services"
  on public.services for select to authenticated
  using (public.is_admin());

drop policy if exists "Admins can insert services" on public.services;
create policy "Admins can insert services"
  on public.services for insert to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update services" on public.services;
create policy "Admins can update services"
  on public.services for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete services" on public.services;
create policy "Admins can delete services"
  on public.services for delete to authenticated
  using (public.is_admin());
