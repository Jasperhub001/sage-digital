import type { ContentStatus } from './content'
import type { InquiryStatus } from './inquiry'
import type { ProjectCategory } from './project'

export interface SiteSettingsRow {
  id: 'default'
  brand_name: string
  business_description: string
  contact_email: string
  whatsapp_number: string | null
  location: string | null
  github_url: string | null
  linkedin_url: string | null
  instagram_url: string | null
  other_social_label: string | null
  other_social_url: string | null
  hero_heading: string
  hero_supporting_text: string
  footer_description: string
  copyright_text: string
  show_contact_email: boolean
  show_whatsapp: boolean
  created_at: string
  updated_at: string
}

export type SiteSettingsInsert = Omit<
  SiteSettingsRow,
  'created_at' | 'updated_at'
> & {
  created_at?: string
  updated_at?: string
}

export type SiteSettingsUpdate = Partial<
  Omit<SiteSettingsRow, 'id' | 'created_at'>
> & {
  updated_at?: string
}

/**
 * Supabase table row shapes (snake_case).
 * These mirror the SQL migration in `supabase/migrations/`.
 *
 * Security note: frontend filters for `status = 'published'` are not enough.
 * Row Level Security on Supabase must enforce public read access.
 */

export interface ProjectRow {
  id: string
  title: string
  slug: string
  description: string
  category: ProjectCategory | string
  technologies: string[]
  cover_image: string
  gallery_images: string[]
  live_url: string | null
  github_url: string | null
  featured: boolean
  display_order: number
  status: ContentStatus
  created_at: string
  updated_at: string
}

export interface ServiceRow {
  id: string
  title: string
  slug: string
  description: string
  icon: string | null
  features: string[]
  display_order: number
  status: ContentStatus
  created_at: string
  updated_at: string
}

/** Insert/update payloads for the admin dashboard. */
export type ProjectInsert = Omit<ProjectRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type ProjectUpdate = Partial<Omit<ProjectRow, 'id' | 'created_at'>> & {
  updated_at?: string
}

export type ServiceInsert = Omit<ServiceRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type ServiceUpdate = Partial<Omit<ServiceRow, 'id' | 'created_at'>> & {
  updated_at?: string
}

export interface InquiryRow {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  status: InquiryStatus
  created_at: string
  updated_at: string
}

export type InquiryInsert = Omit<
  InquiryRow,
  'id' | 'created_at' | 'updated_at' | 'status'
> & {
  id?: string
  status?: InquiryStatus
  created_at?: string
  updated_at?: string
}

export type InquiryUpdate = Partial<Omit<InquiryRow, 'id' | 'created_at'>> & {
  updated_at?: string
}

/**
 * Schema shape expected by `@supabase/supabase-js`.
 * Kept hand-written to match migrations without requiring the CLI generator.
 */
export type Database = {
  public: {
    Tables: {
      projects: {
        Row: ProjectRow
        Insert: ProjectInsert
        Update: ProjectUpdate
        Relationships: []
      }
      services: {
        Row: ServiceRow
        Insert: ServiceInsert
        Update: ServiceUpdate
        Relationships: []
      }
      inquiries: {
        Row: InquiryRow
        Insert: InquiryInsert
        Update: InquiryUpdate
        Relationships: []
      }
      site_settings: {
        Row: SiteSettingsRow
        Insert: SiteSettingsInsert
        Update: SiteSettingsUpdate
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      content_status: ContentStatus
      inquiry_status: InquiryStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
