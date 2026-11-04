export const INQUIRY_STATUSES = [
  'new',
  'read',
  'replied',
  'archived',
] as const

export type InquiryStatus = (typeof INQUIRY_STATUSES)[number]

export interface Inquiry {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  status: InquiryStatus
  createdAt: string
  updatedAt: string
}
