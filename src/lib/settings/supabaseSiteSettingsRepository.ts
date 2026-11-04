import type {
  SiteSettingsInsert,
  SiteSettingsRow,
  SiteSettingsUpdate,
} from '../../types/database'
import { getSupabaseClient } from '../supabase/client'
import type {
  AdminSiteSettingsRepository,
  PublicSiteSettingsRepository,
} from './contracts'
import { mapSiteSettingsRow } from './mappers'

async function requireClient() {
  const client = await getSupabaseClient()
  if (!client) {
    throw new Error('Supabase is not configured.')
  }
  return client
}

async function fetchDefaultRow(): Promise<SiteSettingsRow | null> {
  const client = await requireClient()
  const { data, error } = await client
    .from('site_settings')
    .select('*')
    .eq('id', 'default')
    .maybeSingle()

  if (error) throw error
  return (data as SiteSettingsRow | null) ?? null
}

export const supabasePublicSiteSettingsRepository: PublicSiteSettingsRepository =
  {
    async get() {
      const row = await fetchDefaultRow()
      return row ? mapSiteSettingsRow(row) : null
    },
  }

export const supabaseAdminSiteSettingsRepository: AdminSiteSettingsRepository =
  {
    async get() {
      const row = await fetchDefaultRow()
      return row ? mapSiteSettingsRow(row) : null
    },

    async upsert(payload: SiteSettingsInsert | SiteSettingsUpdate) {
      const client = await requireClient()
      const { data, error } = await client
        .from('site_settings')
        .upsert({ id: 'default', ...payload } as never, { onConflict: 'id' })
        .select('*')
        .single()

      if (error) {
        if (error.code === '23514') {
          throw new Error(
            'Settings could not be saved. Check the fields and try again.',
          )
        }
        throw new Error(
          error.message?.trim()
            ? 'Unable to save website settings.'
            : 'Unable to save website settings.',
        )
      }

      return mapSiteSettingsRow(data as SiteSettingsRow)
    },
  }
