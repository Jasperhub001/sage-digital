import { SITE_SETTINGS_DEFAULTS } from '../../config/siteDefaults'
import type { SiteSettings } from '../../types/siteSettings'

export interface AdminSiteSettingsFormValues {
  brandName: string
  businessDescription: string
  contactEmail: string
  whatsappNumber: string
  location: string
  githubUrl: string
  linkedinUrl: string
  instagramUrl: string
  otherSocialLabel: string
  otherSocialUrl: string
  heroHeading: string
  heroSupportingText: string
  footerDescription: string
  copyrightText: string
  showContactEmail: boolean
  showWhatsapp: boolean
}

export type AdminSiteSettingsFormErrors = Partial<
  Record<keyof AdminSiteSettingsFormValues, string>
>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isOptionalHttpUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  try {
    const url = new URL(trimmed)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function emptySiteSettingsFormValues(): AdminSiteSettingsFormValues {
  return siteSettingsToFormValues(SITE_SETTINGS_DEFAULTS)
}

export function siteSettingsToFormValues(
  settings: SiteSettings,
): AdminSiteSettingsFormValues {
  return {
    brandName: settings.brandName,
    businessDescription: settings.businessDescription,
    contactEmail: settings.contactEmail,
    whatsappNumber: settings.whatsappNumber ?? '',
    location: settings.location ?? '',
    githubUrl: settings.githubUrl ?? '',
    linkedinUrl: settings.linkedinUrl ?? '',
    instagramUrl: settings.instagramUrl ?? '',
    otherSocialLabel: settings.otherSocialLabel ?? '',
    otherSocialUrl: settings.otherSocialUrl ?? '',
    heroHeading: settings.heroHeading,
    heroSupportingText: settings.heroSupportingText,
    footerDescription: settings.footerDescription,
    copyrightText: settings.copyrightText,
    showContactEmail: settings.showContactEmail,
    showWhatsapp: settings.showWhatsapp,
  }
}

export function formValuesToSiteSettings(
  values: AdminSiteSettingsFormValues,
  previous?: SiteSettings | null,
): SiteSettings {
  const base = previous ?? SITE_SETTINGS_DEFAULTS
  return {
    ...base,
    id: 'default',
    brandName: values.brandName.trim(),
    businessDescription: values.businessDescription.trim(),
    contactEmail: values.contactEmail.trim().toLowerCase(),
    whatsappNumber: values.whatsappNumber.trim() || null,
    location: values.location.trim() || null,
    githubUrl: values.githubUrl.trim() || null,
    linkedinUrl: values.linkedinUrl.trim() || null,
    instagramUrl: values.instagramUrl.trim() || null,
    otherSocialLabel: values.otherSocialLabel.trim() || null,
    otherSocialUrl: values.otherSocialUrl.trim() || null,
    heroHeading: values.heroHeading.trim(),
    heroSupportingText: values.heroSupportingText.trim(),
    footerDescription: values.footerDescription.trim(),
    copyrightText: values.copyrightText.trim(),
    showContactEmail: values.showContactEmail,
    showWhatsapp: values.showWhatsapp,
  }
}

export function siteSettingsFormsAreEqual(
  a: AdminSiteSettingsFormValues,
  b: AdminSiteSettingsFormValues,
): boolean {
  return (
    a.brandName === b.brandName &&
    a.businessDescription === b.businessDescription &&
    a.contactEmail === b.contactEmail &&
    a.whatsappNumber === b.whatsappNumber &&
    a.location === b.location &&
    a.githubUrl === b.githubUrl &&
    a.linkedinUrl === b.linkedinUrl &&
    a.instagramUrl === b.instagramUrl &&
    a.otherSocialLabel === b.otherSocialLabel &&
    a.otherSocialUrl === b.otherSocialUrl &&
    a.heroHeading === b.heroHeading &&
    a.heroSupportingText === b.heroSupportingText &&
    a.footerDescription === b.footerDescription &&
    a.copyrightText === b.copyrightText &&
    a.showContactEmail === b.showContactEmail &&
    a.showWhatsapp === b.showWhatsapp
  )
}

export function validateSiteSettingsForm(
  values: AdminSiteSettingsFormValues,
): AdminSiteSettingsFormErrors {
  const errors: AdminSiteSettingsFormErrors = {}

  if (values.brandName.trim().length < 2) {
    errors.brandName = 'Enter a brand name (at least 2 characters).'
  } else if (values.brandName.trim().length > 80) {
    errors.brandName = 'Brand name is too long.'
  }

  if (values.businessDescription.trim().length < 20) {
    errors.businessDescription =
      'Add a short description (at least 20 characters).'
  } else if (values.businessDescription.trim().length > 2000) {
    errors.businessDescription = 'Description is too long.'
  }

  if (!EMAIL_PATTERN.test(values.contactEmail.trim())) {
    errors.contactEmail = 'Enter a valid contact email.'
  }

  const whatsappDigits = values.whatsappNumber.replace(/\D/g, '')
  if (values.whatsappNumber.trim() && (whatsappDigits.length < 7 || whatsappDigits.length > 20)) {
    errors.whatsappNumber =
      'WhatsApp number should be 7–20 digits (international, no +).'
  }

  if (values.location.trim() && values.location.trim().length < 2) {
    errors.location = 'Location is too short.'
  } else if (values.location.trim().length > 120) {
    errors.location = 'Location is too long.'
  }

  if (!isOptionalHttpUrl(values.githubUrl)) {
    errors.githubUrl = 'GitHub URL must be a valid http(s) address or blank.'
  }
  if (!isOptionalHttpUrl(values.linkedinUrl)) {
    errors.linkedinUrl = 'LinkedIn URL must be a valid http(s) address or blank.'
  }
  if (!isOptionalHttpUrl(values.instagramUrl)) {
    errors.instagramUrl =
      'Instagram URL must be a valid http(s) address or blank.'
  }
  if (!isOptionalHttpUrl(values.otherSocialUrl)) {
    errors.otherSocialUrl =
      'Other social URL must be a valid http(s) address or blank.'
  }

  const otherLabel = values.otherSocialLabel.trim()
  const otherUrl = values.otherSocialUrl.trim()
  if (otherLabel && !otherUrl) {
    errors.otherSocialUrl = 'Add a URL for this social link, or clear the label.'
  }
  if (otherUrl && !otherLabel) {
    errors.otherSocialLabel = 'Add a label for this social link, or clear the URL.'
  }

  if (values.heroHeading.trim().length < 8) {
    errors.heroHeading = 'Hero heading should be at least 8 characters.'
  } else if (values.heroHeading.trim().length > 200) {
    errors.heroHeading = 'Hero heading is too long.'
  }

  if (values.heroSupportingText.trim().length < 20) {
    errors.heroSupportingText =
      'Hero supporting text should be at least 20 characters.'
  } else if (values.heroSupportingText.trim().length > 600) {
    errors.heroSupportingText = 'Hero supporting text is too long.'
  }

  if (values.footerDescription.trim().length < 20) {
    errors.footerDescription =
      'Footer description should be at least 20 characters.'
  } else if (values.footerDescription.trim().length > 400) {
    errors.footerDescription = 'Footer description is too long.'
  }

  if (values.copyrightText.trim().length < 4) {
    errors.copyrightText = 'Enter copyright text (use {year} for the year).'
  } else if (values.copyrightText.trim().length > 160) {
    errors.copyrightText = 'Copyright text is too long.'
  }

  return errors
}
