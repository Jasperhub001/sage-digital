import type { InquiryInsert, InquiryUpdate } from '../../types/database'
import type { Inquiry, InquiryStatus } from '../../types/inquiry'

export type InquiryStatusFilter = InquiryStatus | 'all'

export interface PublicInquiryRepository {
  create: (payload: InquiryInsert) => Promise<Inquiry>
}

export interface AdminInquiryRepository {
  listAll: (status?: InquiryStatusFilter) => Promise<Inquiry[]>
  getById: (id: string) => Promise<Inquiry | null>
  update: (id: string, payload: InquiryUpdate) => Promise<Inquiry>
  setStatus: (id: string, status: InquiryStatus) => Promise<Inquiry>
  remove: (id: string) => Promise<void>
  countAll: () => Promise<number>
}
