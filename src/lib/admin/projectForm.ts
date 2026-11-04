import type { ContentStatus } from '../../types/content'
import type { ProjectInsert, ProjectUpdate } from '../../types/database'
import {
  PROJECT_CATEGORIES,
  type ProjectCategory,
} from '../../types/project'
import type { AdminProjectRecord } from '../content/contracts'
import { isUrlFriendlySlug, slugifyTitle } from '../content/slugify'

export interface AdminProjectFormValues {
  title: string
  slug: string
  description: string
  category: ProjectCategory
  /** One technology per line or comma-separated */
  technologiesText: string
  coverImage: string
  /** One image URL/path per line */
  galleryText: string
  liveUrl: string
  githubUrl: string
  featured: boolean
  displayOrder: number
  status: ContentStatus
}

export type AdminProjectFormErrors = Partial<
  Record<keyof AdminProjectFormValues, string>
>

export function emptyProjectFormValues(
  defaults?: Partial<AdminProjectFormValues>,
): AdminProjectFormValues {
  return {
    title: '',
    slug: '',
    description: '',
    category: PROJECT_CATEGORIES[0],
    technologiesText: '',
    coverImage: '',
    galleryText: '',
    liveUrl: '',
    githubUrl: '',
    featured: false,
    displayOrder: 0,
    status: 'draft',
    ...defaults,
  }
}

export function projectToFormValues(
  project: AdminProjectRecord,
): AdminProjectFormValues {
  return {
    title: project.title,
    slug: project.slug,
    description: project.description,
    category: project.category,
    technologiesText: project.technologies.join('\n'),
    coverImage: project.coverImage,
    galleryText: project.gallery.join('\n'),
    liveUrl: project.liveUrl ?? '',
    githubUrl: project.githubUrl ?? '',
    featured: project.featured,
    displayOrder: project.displayOrder,
    status: project.status,
  }
}

function parseList(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/** Cover/gallery may be absolute http(s) URLs or site-relative paths. */
export function isValidAssetRef(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('/')) return trimmed.length > 1
  return isHttpUrl(trimmed)
}

export function isOptionalHttpUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  return isHttpUrl(trimmed)
}

export function suggestSlugFromTitle(title: string): string {
  return slugifyTitle(title)
}

export function validateProjectForm(
  values: AdminProjectFormValues,
): AdminProjectFormErrors {
  const errors: AdminProjectFormErrors = {}

  if (!values.title.trim()) {
    errors.title = 'Title is required.'
  }

  const slug = values.slug.trim()
  if (!slug) {
    errors.slug = 'Slug is required.'
  } else if (!isUrlFriendlySlug(slug)) {
    errors.slug =
      'Use a URL-friendly slug: lowercase letters, numbers, and hyphens only.'
  }

  if (!values.description.trim()) {
    errors.description = 'Description is required.'
  }

  if (!PROJECT_CATEGORIES.includes(values.category)) {
    errors.category = 'Choose a valid category.'
  }

  if (!isValidAssetRef(values.coverImage)) {
    errors.coverImage =
      'Cover image is required. Use an https URL or a site path like /images/....'
  }

  const gallery = parseList(values.galleryText)
  const invalidGallery = gallery.find((item) => !isValidAssetRef(item))
  if (invalidGallery) {
    errors.galleryText =
      'Each gallery entry must be an https URL or a site-relative path.'
  }

  if (!isOptionalHttpUrl(values.liveUrl)) {
    errors.liveUrl = 'Live URL must be a valid http(s) address or left blank.'
  }

  if (!isOptionalHttpUrl(values.githubUrl)) {
    errors.githubUrl = 'GitHub URL must be a valid http(s) address or left blank.'
  }

  if (
    !Number.isFinite(values.displayOrder) ||
    !Number.isInteger(values.displayOrder)
  ) {
    errors.displayOrder = 'Display order must be a whole number.'
  }

  if (values.status !== 'draft' && values.status !== 'published') {
    errors.status = 'Choose Draft or Published.'
  }

  return errors
}

export function formValuesToInsert(
  values: AdminProjectFormValues,
): ProjectInsert {
  const live = values.liveUrl.trim()
  const github = values.githubUrl.trim()

  return {
    title: values.title.trim(),
    slug: values.slug.trim(),
    description: values.description.trim(),
    category: values.category,
    technologies: parseList(values.technologiesText),
    cover_image: values.coverImage.trim(),
    gallery_images: parseList(values.galleryText),
    live_url: live ? live : null,
    github_url: github ? github : null,
    featured: values.featured,
    display_order: values.displayOrder,
    status: values.status,
  }
}

export function formValuesToUpdate(
  values: AdminProjectFormValues,
): ProjectUpdate {
  return formValuesToInsert(values)
}

export function formsAreEqual(
  a: AdminProjectFormValues,
  b: AdminProjectFormValues,
): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
