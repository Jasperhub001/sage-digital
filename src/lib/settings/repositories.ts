import { isSupabaseConfigured } from '../supabase/client'
import type {
  AdminSiteSettingsRepository,
  PublicSiteSettingsRepository,
} from './contracts'

export async function getPublicSiteSettingsRepository(): Promise<PublicSiteSettingsRepository> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.')
  }
  const mod = await import('./supabaseSiteSettingsRepository')
  return mod.supabasePublicSiteSettingsRepository
}

export async function getAdminSiteSettingsRepository(): Promise<AdminSiteSettingsRepository> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.')
  }
  const mod = await import('./supabaseSiteSettingsRepository')
  return mod.supabaseAdminSiteSettingsRepository
}
