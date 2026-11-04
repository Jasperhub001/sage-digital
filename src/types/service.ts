/**
 * Public service shape for portfolio UI.
 * Maps from Supabase `services` rows (published only).
 */
export interface Service {
  id: string
  slug: string
  title: string
  description: string
  /** Maps from database column `icon` */
  iconUrl: string | null
  /** Optional bullet points; empty until provided via admin/CMS */
  features: string[]
  displayOrder: number
}
