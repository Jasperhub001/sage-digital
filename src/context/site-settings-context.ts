import { createContext } from 'react'
import { SITE_SETTINGS_DEFAULTS } from '../config/siteDefaults'
import type { SiteSettings, SiteSocialLink } from '../types/siteSettings'

export interface SiteSettingsContextValue {
  settings: SiteSettings
  socialLinks: SiteSocialLink[]
  /** True until the first public fetch settles (defaults are shown meanwhile). */
  isLoading: boolean
  /** True when values came from local defaults rather than Supabase. */
  usingDefaults: boolean
}

export const SiteSettingsContext = createContext<SiteSettingsContextValue>({
  settings: SITE_SETTINGS_DEFAULTS,
  socialLinks: [],
  isLoading: true,
  usingDefaults: true,
})
