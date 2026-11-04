import type { InquiryStatusFilter } from '../lib/inquiries/contracts'
import { getAdminInquiryRepository } from '../lib/inquiries/repositories'
import { isSupabaseConfigured } from '../lib/supabase/client'
import type { Inquiry, InquiryStatus } from '../types/inquiry'

async function requireAdminInquiryRepository() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Inquiry management requires Supabase configuration and an administrator session.',
    )
  }
  return getAdminInquiryRepository()
}

export const adminInquiryService = {
  async listAll(status: InquiryStatusFilter = 'all'): Promise<Inquiry[]> {
    const repo = await requireAdminInquiryRepository()
    return repo.listAll(status)
  },

  async getById(id: string): Promise<Inquiry | null> {
    const repo = await requireAdminInquiryRepository()
    return repo.getById(id)
  },

  async setStatus(id: string, status: InquiryStatus): Promise<Inquiry> {
    const repo = await requireAdminInquiryRepository()
    return repo.setStatus(id, status)
  },

  async markRead(id: string): Promise<Inquiry> {
    return this.setStatus(id, 'read')
  },

  async markReplied(id: string): Promise<Inquiry> {
    return this.setStatus(id, 'replied')
  },

  async archive(id: string): Promise<Inquiry> {
    return this.setStatus(id, 'archived')
  },

  async restore(id: string): Promise<Inquiry> {
    return this.setStatus(id, 'read')
  },

  async remove(id: string): Promise<void> {
    const repo = await requireAdminInquiryRepository()
    await repo.remove(id)
  },

  async countAll(): Promise<number> {
    const repo = await requireAdminInquiryRepository()
    return repo.countAll()
  },
}
