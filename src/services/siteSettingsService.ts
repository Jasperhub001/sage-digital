import { SITE_SETTINGS_DEFAULTS } from '../config/siteDefaults'
import { getPublicSiteSettingsRepository } from '../lib/settings/repositories'
import { isSupabaseConfigured } from '../lib/supabase/client'
import type { SiteSettings } from '../types/siteSettings'

export interface PublicSiteSettingsResult {
  settings: SiteSettings
  source: 'remote' | 'defaults'
}

/**
 * Public read of website settings with safe defaults.
 * Never throws for missing configuration — returns defaults instead.
 */
export async function getPublicSiteSettings(): Promise<PublicSiteSettingsResult> {
  if (!isSupabaseConfigured()) {
    return { settings: SITE_SETTINGS_DEFAULTS, source: 'defaults' }
  }

  try {
    const repo = await getPublicSiteSettingsRepository()
    const row = await repo.get()
    if (!row) {
      return { settings: SITE_SETTINGS_DEFAULTS, source: 'defaults' }
    }
    return { settings: row, source: 'remote' }
  } catch {
    return { settings: SITE_SETTINGS_DEFAULTS, source: 'defaults' }
  }
}
