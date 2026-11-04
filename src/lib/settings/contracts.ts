import type { SiteSettingsInsert, SiteSettingsUpdate } from '../../types/database'
import type { SiteSettings } from '../../types/siteSettings'

export interface PublicSiteSettingsRepository {
  get: () => Promise<SiteSettings | null>
}

export interface AdminSiteSettingsRepository {
  get: () => Promise<SiteSettings | null>
  upsert: (
    payload: SiteSettingsInsert | SiteSettingsUpdate,
  ) => Promise<SiteSettings>
}
