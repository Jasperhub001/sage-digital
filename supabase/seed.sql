-- SÅGÊ Digital — initial published portfolio seed
-- Source: src/data/publishedProjects.ts + src/data/publishedServices.ts
--
-- Run in the Supabase SQL Editor AFTER applying the schema migration.
-- Safe to re-run: conflicts on slug update the same logical records.
-- Do not invent or alter content beyond the local fallback source.

-- ---------------------------------------------------------------------------
-- Services (4)
-- Stable UUIDs are fixed so re-seeds stay consistent.
-- ---------------------------------------------------------------------------

insert into public.services (
  id,
  title,
  slug,
  description,
  icon,
  features,
  display_order,
  status
) values
  (
    '8f3c2a10-6b4e-4d91-9c2a-1e7b5d4f8b01',
    'Website Development',
    'website-development',
    'Custom, performance-minded websites that present your brand with clarity and convert visitors into clients.',
    null,
    '{}',
    1,
    'published'
  ),
  (
    '8f3c2a10-6b4e-4d91-9c2a-1e7b5d4f8b02',
    'Landing Page Development',
    'landing-page-development',
    'Focused campaign pages built around a single offer — sharp messaging, persuasive structure, and measurable results.',
    null,
    '{}',
    2,
    'published'
  ),
  (
    '8f3c2a10-6b4e-4d91-9c2a-1e7b5d4f8b03',
    'AI Integrations',
    'ai-integrations',
    'Practical AI woven into your product or operations — assistants, workflows, and tools that save time without complexity.',
    null,
    '{}',
    3,
    'published'
  ),
  (
    '8f3c2a10-6b4e-4d91-9c2a-1e7b5d4f8b04',
    'Business Automation',
    'business-automation',
    'Connected systems that remove repetitive work across CRM, billing, reporting, and client communication.',
    null,
    '{}',
    4,
    'published'
  )
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  features = excluded.features,
  display_order = excluded.display_order,
  status = excluded.status,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Projects (1)
-- ---------------------------------------------------------------------------

insert into public.projects (
  id,
  title,
  slug,
  description,
  category,
  technologies,
  cover_image,
  gallery_images,
  live_url,
  github_url,
  featured,
  display_order,
  status
) values
  (
    '8f3c2a10-6b4e-4d91-9c2a-1e7b5d4f8a01',
    'SÅGÊ Study Planner',
    'sage-study-planner',
    'A student-focused study planning platform designed to help tertiary students organise subjects, manage availability and generate structured study schedules.',
    'Websites',
    array['React', 'TypeScript', 'Vite']::text[],
    '/images/projects/sage-study-planner-cover.svg',
    array[
      '/images/projects/sage-study-planner-1.svg',
      '/images/projects/sage-study-planner-2.svg'
    ]::text[],
    'https://sage-study-planner.vercel.app/',
    null,
    true,
    1,
    'published'
  )
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  technologies = excluded.technologies,
  cover_image = excluded.cover_image,
  gallery_images = excluded.gallery_images,
  live_url = excluded.live_url,
  github_url = excluded.github_url,
  featured = excluded.featured,
  display_order = excluded.display_order,
  status = excluded.status,
  updated_at = now();
