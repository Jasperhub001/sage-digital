import type { ContentStatus } from '../../types/content'
import type {
  ServiceInsert,
  ServiceRow,
  ServiceUpdate,
} from '../../types/database'
import { getSupabaseClient } from '../supabase/client'
import type {
  AdminServiceRecord,
  AdminServiceRepository,
  PublicServiceRecord,
  PublicServiceRepository,
} from './contracts'
import { mapServiceRow } from './mappers'

async function requireClient() {
  const client = await getSupabaseClient()
  if (!client) {
    throw new Error('Supabase is not configured.')
  }
  return client
}

function toPublic(row: ServiceRow): PublicServiceRecord | null {
  if (row.status !== 'published') return null
  const mapped = mapServiceRow(row)
  return { ...mapped, status: 'published' }
}

function toAdmin(row: ServiceRow): AdminServiceRecord {
  return mapServiceRow(row)
}

function mapServiceWriteError(error: {
  code?: string
  message?: string
}): Error {
  if (error.code === '23505') {
    return new Error(
      'A service with this slug already exists. Choose a different slug.',
    )
  }

  return new Error(
    error.message?.trim()
      ? 'Unable to save the service. Please review the fields and try again.'
      : 'Unable to save the service.',
  )
}

export const supabaseServiceRepository: PublicServiceRepository = {
  async listPublished() {
    const client = await requireClient()
    const { data, error } = await client
      .from('services')
      .select('*')
      .eq('status', 'published')
      .order('display_order', { ascending: true })

    if (error) throw error

    return (data ?? [])
      .map((row) => toPublic(row as ServiceRow))
      .filter((row): row is PublicServiceRecord => row !== null)
  },

  async getBySlug(slug) {
    const client = await requireClient()
    const { data, error } = await client
      .from('services')
      .select('*')
      .eq('status', 'published')
      .eq('slug', slug)
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    return toPublic(data as ServiceRow)
  },
}

/**
 * Administrator repository — requires authenticated admin session + RLS.
 * Never call from public pages.
 */
export const supabaseAdminServiceRepository: AdminServiceRepository = {
  async listAll() {
    const client = await requireClient()
    const { data, error } = await client
      .from('services')
      .select('*')
      .order('display_order', { ascending: true })
      .order('updated_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map((row) => toAdmin(row as ServiceRow))
  },

  async getById(id) {
    const client = await requireClient()
    const { data, error } = await client
      .from('services')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    return toAdmin(data as ServiceRow)
  },

  async create(payload: ServiceInsert) {
    const client = await requireClient()
    const { data, error } = await client
      .from('services')
      .insert(payload as never)
      .select('*')
      .single()

    if (error) throw mapServiceWriteError(error)
    return toAdmin(data as ServiceRow)
  },

  async update(id, payload: ServiceUpdate) {
    const client = await requireClient()
    const { data, error } = await client
      .from('services')
      .update(payload as never)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw mapServiceWriteError(error)
    return toAdmin(data as ServiceRow)
  },

  async remove(id) {
    const client = await requireClient()
    const { error } = await client.from('services').delete().eq('id', id)
    if (error) throw error
  },

  async setStatus(id, status: ContentStatus) {
    return this.update(id, { status })
  },

  async reorder(orderedIds) {
    const client = await requireClient()

    for (let index = 0; index < orderedIds.length; index += 1) {
      const id = orderedIds[index]
      if (!id) continue
      const { error } = await client
        .from('services')
        .update({ display_order: index + 1 } as never)
        .eq('id', id)
      if (error) throw error
    }
  },
}
