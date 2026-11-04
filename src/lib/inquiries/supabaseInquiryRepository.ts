import type {
  InquiryInsert,
  InquiryRow,
  InquiryUpdate,
} from '../../types/database'
import type { InquiryStatus } from '../../types/inquiry'
import { getSupabaseClient } from '../supabase/client'
import type {
  AdminInquiryRepository,
  InquiryStatusFilter,
  PublicInquiryRepository,
} from './contracts'
import { mapInquiryRow } from './mappers'

async function requireClient() {
  const client = await getSupabaseClient()
  if (!client) {
    throw new Error('Supabase is not configured.')
  }
  return client
}

/**
 * Direct browser INSERT is revoked (Stage 10.3). Public submissions must use
 * the `submit-inquiry` Edge Function. This repository method remains only as a
 * hard failure guard if called accidentally.
 */
export const supabasePublicInquiryRepository: PublicInquiryRepository = {
  async create(_payload: InquiryInsert) {
    void _payload
    throw new Error(
      'Direct inquiry inserts are disabled. Use the submit-inquiry Edge Function.',
    )
  },
}

export const supabaseAdminInquiryRepository: AdminInquiryRepository = {
  async listAll(status: InquiryStatusFilter = 'all') {
    const client = await requireClient()
    let query = client
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map((row) => mapInquiryRow(row as InquiryRow))
  },

  async getById(id) {
    const client = await requireClient()
    const { data, error } = await client
      .from('inquiries')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    return mapInquiryRow(data as InquiryRow)
  },

  async update(id, payload: InquiryUpdate) {
    const client = await requireClient()
    const { data, error } = await client
      .from('inquiries')
      .update(payload as never)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return mapInquiryRow(data as InquiryRow)
  },

  async setStatus(id, status: InquiryStatus) {
    return this.update(id, { status })
  },

  async remove(id) {
    const client = await requireClient()
    const { error } = await client.from('inquiries').delete().eq('id', id)
    if (error) throw error
  },

  async countAll() {
    const client = await requireClient()
    const { count, error } = await client
      .from('inquiries')
      .select('id', { count: 'exact', head: true })

    if (error) throw error
    return count ?? 0
  },
}
