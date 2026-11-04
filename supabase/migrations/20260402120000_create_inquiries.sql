-- SÅGÊ Digital — Stage 9.6 contact inquiries
-- Apply manually in the Supabase SQL editor or via the Supabase CLI.
-- Do not apply automatically from the frontend.
--
-- SECURITY:
-- - anon / authenticated may INSERT only (public contact form).
-- - No public SELECT / UPDATE / DELETE.
-- - Admins may SELECT / UPDATE / DELETE via public.is_admin().
-- - Never put service_role keys in the Vite frontend.
--
-- Prerequisite: public.is_admin() from admin content policies migration.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'inquiry_status'
      and n.nspname = 'public'
  ) then
    create type public.inquiry_status as enum (
      'new',
      'read',
      'replied',
      'archived'
    );
  end if;
end
$$;

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  status public.inquiry_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inquiries_name_not_blank check (length(trim(name)) between 2 and 120),
  constraint inquiries_email_not_blank check (length(trim(email)) between 5 and 254),
  constraint inquiries_email_format check (
    email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint inquiries_phone_length check (
    phone is null or length(trim(phone)) between 7 and 40
  ),
  constraint inquiries_subject_length check (
    subject is null or length(trim(subject)) between 1 and 160
  ),
  constraint inquiries_message_length check (length(trim(message)) between 20 and 5000)
);

create index if not exists inquiries_status_created_idx
  on public.inquiries (status, created_at desc);

create index if not exists inquiries_created_idx
  on public.inquiries (created_at desc);

drop trigger if exists inquiries_set_updated_at on public.inquiries;
create trigger inquiries_set_updated_at
before update on public.inquiries
for each row
execute function public.set_updated_at();

alter table public.inquiries enable row level security;
alter table public.inquiries force row level security;

revoke all on table public.inquiries from anon, authenticated;

-- Public may only insert; admins need full access under RLS.
grant insert on table public.inquiries to anon, authenticated;
grant select, update, delete on table public.inquiries to authenticated;

-- Public insert: always land as status = new; length constraints enforce payload shape.
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
