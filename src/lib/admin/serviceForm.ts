import type { ContentStatus } from '../../types/content'
import type { ServiceInsert, ServiceUpdate } from '../../types/database'
import type { AdminServiceRecord } from '../content/contracts'
import { isUrlFriendlySlug, slugifyTitle } from '../content/slugify'
import { isValidAssetRef } from './projectForm'

export interface AdminServiceFormValues {
  title: string
  slug: string
  description: string
  /** Maps to DB column `icon`; optional URL or site path */
  iconUrl: string
  features: string[]
  displayOrder: number
  status: ContentStatus
}

export type AdminServiceFormErrors = Partial<
  Record<keyof AdminServiceFormValues | 'featuresItem', string>
>

export function emptyServiceFormValues(
  defaults?: Partial<AdminServiceFormValues>,
): AdminServiceFormValues {
  return {
    title: '',
    slug: '',
    description: '',
    iconUrl: '',
    features: [''],
    displayOrder: 0,
    status: 'draft',
    ...defaults,
  }
}

export function serviceToFormValues(
  service: AdminServiceRecord,
): AdminServiceFormValues {
  return {
    title: service.title,
    slug: service.slug,
    description: service.description,
    iconUrl: service.iconUrl ?? '',
    features: service.features.length > 0 ? [...service.features] : [''],
    displayOrder: service.displayOrder,
    status: service.status,
  }
}

function cleanedFeatures(features: string[]): string[] {
  return features.map((item) => item.trim()).filter(Boolean)
}

export function suggestSlugFromTitle(title: string): string {
  return slugifyTitle(title)
}

export function validateServiceForm(
  values: AdminServiceFormValues,
): AdminServiceFormErrors {
  const errors: AdminServiceFormErrors = {}

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

  const icon = values.iconUrl.trim()
  if (icon && !isValidAssetRef(icon)) {
    errors.iconUrl =
      'Icon must be an https URL, a site path like /icons/...., or left blank.'
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

export function formValuesToServiceInsert(
  values: AdminServiceFormValues,
): ServiceInsert {
  const icon = values.iconUrl.trim()

  return {
    title: values.title.trim(),
    slug: values.slug.trim(),
    description: values.description.trim(),
    icon: icon ? icon : null,
    features: cleanedFeatures(values.features),
    display_order: values.displayOrder,
    status: values.status,
  }
}

export function formValuesToServiceUpdate(
  values: AdminServiceFormValues,
): ServiceUpdate {
  return formValuesToServiceInsert(values)
}

export function serviceFormsAreEqual(
  a: AdminServiceFormValues,
  b: AdminServiceFormValues,
): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
