import { isSupabaseConfigured } from '../supabase/client'
import type {
  AdminInquiryRepository,
  PublicInquiryRepository,
} from './contracts'

export async function getPublicInquiryRepository(): Promise<PublicInquiryRepository> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.')
  }
  const mod = await import('./supabaseInquiryRepository')
  return mod.supabasePublicInquiryRepository
}

export async function getAdminInquiryRepository(): Promise<AdminInquiryRepository> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.')
  }
  const mod = await import('./supabaseInquiryRepository')
  return mod.supabaseAdminInquiryRepository
}
