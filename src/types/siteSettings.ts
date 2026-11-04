export interface SiteSettings {
  id: 'default'
  brandName: string
  businessDescription: string
  contactEmail: string
  whatsappNumber: string | null
  location: string | null
  githubUrl: string | null
  linkedinUrl: string | null
  instagramUrl: string | null
  otherSocialLabel: string | null
  otherSocialUrl: string | null
  heroHeading: string
  heroSupportingText: string
  footerDescription: string
  copyrightText: string
  showContactEmail: boolean
  showWhatsapp: boolean
  createdAt: string
  updatedAt: string
}

export interface SiteSocialLink {
  id: string
  label: string
  href: string
}
