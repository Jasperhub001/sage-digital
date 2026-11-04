/**
 * Shared publishing vocabulary for the future admin + Supabase layer.
 *
 * Public pages must only ever consume `published` records.
 * Draft / unpublished rows stay behind authenticated admin APIs and RLS.
 */
export type ContentStatus = 'draft' | 'published'

export interface PublishableFields {
  status: ContentStatus
  displayOrder: number
  createdAt: string
  updatedAt: string
}
