import type {
  SiteSettingsInsert,
  SiteSettingsRow,
  SiteSettingsUpdate,
} from '../../types/database'
import type { SiteSettings, SiteSocialLink } from '../../types/siteSettings'

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? ''
  return trimmed ? trimmed : null
}

export function mapSiteSettingsRow(row: SiteSettingsRow): SiteSettings {
  return {
    id: 'default',
    brandName: row.brand_name,
    businessDescription: row.business_description,
    contactEmail: row.contact_email,
    whatsappNumber: row.whatsapp_number,
    location: row.location,
    githubUrl: row.github_url,
    linkedinUrl: row.linkedin_url,
    instagramUrl: row.instagram_url,
    otherSocialLabel: row.other_social_label,
    otherSocialUrl: row.other_social_url,
    heroHeading: row.hero_heading,
    heroSupportingText: row.hero_supporting_text,
    footerDescription: row.footer_description,
    copyrightText: row.copyright_text,
    showContactEmail: row.show_contact_email,
    showWhatsapp: row.show_whatsapp,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function siteSettingsToInsert(settings: SiteSettings): SiteSettingsInsert {
  return {
    id: 'default',
    brand_name: settings.brandName.trim(),
    business_description: settings.businessDescription.trim(),
    contact_email: settings.contactEmail.trim().toLowerCase(),
    whatsapp_number: emptyToNull(settings.whatsappNumber),
    location: emptyToNull(settings.location),
    github_url: emptyToNull(settings.githubUrl),
    linkedin_url: emptyToNull(settings.linkedinUrl),
    instagram_url: emptyToNull(settings.instagramUrl),
    other_social_label: emptyToNull(settings.otherSocialLabel),
    other_social_url: emptyToNull(settings.otherSocialUrl),
    hero_heading: settings.heroHeading.trim(),
    hero_supporting_text: settings.heroSupportingText.trim(),
    footer_description: settings.footerDescription.trim(),
    copyright_text: settings.copyrightText.trim(),
    show_contact_email: settings.showContactEmail,
    show_whatsapp: settings.showWhatsapp,
  }
}

export function siteSettingsToUpdate(
  settings: SiteSettings,
): SiteSettingsUpdate {
  const { id: _id, ...rest } = siteSettingsToInsert(settings)
  void _id
  return rest
}

export function buildSocialLinks(settings: SiteSettings): SiteSocialLink[] {
  const links: SiteSocialLink[] = []

  if (settings.githubUrl?.trim()) {
    links.push({ id: 'github', label: 'GitHub', href: settings.githubUrl.trim() })
  }
  if (settings.linkedinUrl?.trim()) {
    links.push({
      id: 'linkedin',
      label: 'LinkedIn',
      href: settings.linkedinUrl.trim(),
    })
  }
  if (settings.instagramUrl?.trim()) {
    links.push({
      id: 'instagram',
      label: 'Instagram',
      href: settings.instagramUrl.trim(),
    })
  }
  if (settings.otherSocialUrl?.trim() && settings.otherSocialLabel?.trim()) {
    links.push({
      id: 'other',
      label: settings.otherSocialLabel.trim(),
      href: settings.otherSocialUrl.trim(),
    })
  }

  return links
}
