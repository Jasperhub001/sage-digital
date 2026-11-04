-- SÅGÊ Digital — Stage 9.7 public website settings (singleton row)
-- Apply manually in the Supabase SQL editor or via the Supabase CLI.
-- Do not apply automatically from the frontend.
--
-- SECURITY:
-- - Public (anon / authenticated) may SELECT only — all columns are public display fields.
-- - Admins may INSERT / UPDATE / DELETE via public.is_admin().
-- - No private admin secrets belong in this table.
-- - Never put service_role keys in the Vite frontend.
--
-- Prerequisite: public.is_admin() and public.set_updated_at() from earlier migrations.

create table if not exists public.site_settings (
  id text primary key default 'default' check (id = 'default'),
  brand_name text not null,
  business_description text not null,
  contact_email text not null,
  whatsapp_number text,
  location text,
  github_url text,
  linkedin_url text,
  instagram_url text,
  other_social_label text,
  other_social_url text,
  hero_heading text not null,
  hero_supporting_text text not null,
  footer_description text not null,
  copyright_text text not null,
  show_contact_email boolean not null default true,
  show_whatsapp boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_settings_brand_name_length check (
    length(trim(brand_name)) between 2 and 80
  ),
  constraint site_settings_business_description_length check (
    length(trim(business_description)) between 20 and 2000
  ),
  constraint site_settings_contact_email_length check (
    length(trim(contact_email)) between 5 and 254
  ),
  constraint site_settings_contact_email_format check (
    contact_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint site_settings_whatsapp_length check (
    whatsapp_number is null
    or length(trim(whatsapp_number)) between 7 and 20
  ),
  constraint site_settings_location_length check (
    location is null or length(trim(location)) between 2 and 120
  ),
  constraint site_settings_github_url_length check (
    github_url is null or length(trim(github_url)) between 8 and 500
  ),
  constraint site_settings_linkedin_url_length check (
    linkedin_url is null or length(trim(linkedin_url)) between 8 and 500
  ),
  constraint site_settings_instagram_url_length check (
    instagram_url is null or length(trim(instagram_url)) between 8 and 500
  ),
  constraint site_settings_other_social_label_length check (
    other_social_label is null
    or length(trim(other_social_label)) between 2 and 40
  ),
  constraint site_settings_other_social_url_length check (
    other_social_url is null
    or length(trim(other_social_url)) between 8 and 500
  ),
  constraint site_settings_hero_heading_length check (
    length(trim(hero_heading)) between 8 and 200
  ),
  constraint site_settings_hero_supporting_text_length check (
    length(trim(hero_supporting_text)) between 20 and 600
  ),
  constraint site_settings_footer_description_length check (
    length(trim(footer_description)) between 20 and 400
  ),
  constraint site_settings_copyright_text_length check (
    length(trim(copyright_text)) between 4 and 160
  ),
  constraint site_settings_other_social_pair check (
    (other_social_url is null and other_social_label is null)
    or (
      other_social_url is not null
      and other_social_label is not null
      and length(trim(other_social_url)) > 0
      and length(trim(other_social_label)) > 0
    )
  )
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row
execute function public.set_updated_at();

alter table public.site_settings enable row level security;
alter table public.site_settings force row level security;

revoke all on table public.site_settings from anon, authenticated;
grant select on table public.site_settings to anon, authenticated;
grant insert, update, delete on table public.site_settings to authenticated;

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

-- Seed current live copy so the public site has a row after migration.
insert into public.site_settings (
  id,
  brand_name,
  business_description,
  contact_email,
  whatsapp_number,
  location,
  github_url,
  linkedin_url,
  instagram_url,
  other_social_label,
  other_social_url,
  hero_heading,
  hero_supporting_text,
  footer_description,
  copyright_text,
  show_contact_email,
  show_whatsapp
)
values (
  'default',
  'SÅGÊ Digital',
  'SÅGÊ Digital partners with ambitious businesses to design and ship websites, landing pages, AI integrations and automation systems. The work is intentional, the process is collaborative, and every delivery is built to perform long after launch.',
  'lunarsagexiv@gmail.com',
  '2347070296633',
  null,
  null,
  null,
  null,
  null,
  null,
  'We Build Digital Experiences That Move Businesses Forward.',
  'Premium websites, high-converting landing pages, AI integrations and intelligent automation — crafted to elevate brands and accelerate growth.',
  'Websites, landing pages, AI integrations and automation — crafted to move businesses forward.',
  '© {year} SÅGÊ Digital. All rights reserved.',
  true,
  true
)
on conflict (id) do nothing;
