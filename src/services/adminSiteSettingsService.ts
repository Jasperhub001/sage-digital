import {
  formValuesToSiteSettings,
  type AdminSiteSettingsFormValues,
} from '../lib/admin/siteSettingsForm'
import { siteSettingsToInsert } from '../lib/settings/mappers'
import { getAdminSiteSettingsRepository } from '../lib/settings/repositories'
import { isSupabaseConfigured } from '../lib/supabase/client'
import type { SiteSettings } from '../types/siteSettings'
import { SITE_SETTINGS_DEFAULTS } from '../config/siteDefaults'

async function requireAdminRepo() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Website settings require Supabase configuration and an administrator session.',
    )
  }
  return getAdminSiteSettingsRepository()
}

export const adminSiteSettingsService = {
  async get(): Promise<SiteSettings> {
    const repo = await requireAdminRepo()
    const row = await repo.get()
    return row ?? SITE_SETTINGS_DEFAULTS
  },

  async save(values: AdminSiteSettingsFormValues): Promise<SiteSettings> {
    const repo = await requireAdminRepo()
    const existing = await repo.get()
    const next = formValuesToSiteSettings(values, existing)
    return repo.upsert(siteSettingsToInsert(next))
  },
}
