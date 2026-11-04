import type { SiteSettings } from '../types/siteSettings'

/**
 * Safe public fallbacks matching the current live portfolio copy.
 * Used when Supabase is offline, unset, or the settings row is missing.
 */
export const SITE_SETTINGS_DEFAULTS: SiteSettings = {
  id: 'default',
  brandName: 'SÅGÊ Digital',
  businessDescription:
    'SÅGÊ Digital partners with ambitious businesses to design and ship websites, landing pages, AI integrations and automation systems. The work is intentional, the process is collaborative, and every delivery is built to perform long after launch.',
  contactEmail: 'lunarsagexiv@gmail.com',
  whatsappNumber: '2347070296633',
  location: null,
  githubUrl: null,
  linkedinUrl: null,
  instagramUrl: null,
  otherSocialLabel: null,
  otherSocialUrl: null,
  heroHeading: 'We Build Digital Experiences That Move Businesses Forward.',
  heroSupportingText:
    'Premium websites, high-converting landing pages, AI integrations and intelligent automation — crafted to elevate brands and accelerate growth.',
  footerDescription:
    'Websites, landing pages, AI integrations and automation — crafted to move businesses forward.',
  copyrightText: '© {year} SÅGÊ Digital. All rights reserved.',
  showContactEmail: true,
  showWhatsapp: true,
  createdAt: '',
  updatedAt: '',
}

export function formatCopyrightText(
  template: string,
  brandName: string,
  year = new Date().getFullYear(),
): string {
  const trimmed = template.trim()
  if (!trimmed) {
    return `© ${year} ${brandName}. All rights reserved.`
  }
  return trimmed
    .replaceAll('{year}', String(year))
    .replaceAll('{brand}', brandName)
}

/** Split brand for navbar accent styling (last word highlighted when multi-word). */
export function splitBrandName(brandName: string): {
  primary: string
  accent: string | null
} {
  const trimmed = brandName.trim()
  const space = trimmed.lastIndexOf(' ')
  if (space <= 0) {
    return { primary: trimmed, accent: null }
  }
  return {
    primary: trimmed.slice(0, space),
    accent: trimmed.slice(space + 1),
  }
}
