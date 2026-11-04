import { isSupabaseConfigured } from '../supabase/client'
import type {
  AdminProjectRepository,
  AdminServiceRepository,
  PublicProjectRepository,
  PublicServiceRepository,
} from './contracts'
import {
  localAdminProjectRepository,
  localProjectRepository,
} from './localProjectRepository'
import {
  localAdminServiceRepository,
  localServiceRepository,
} from './localServiceRepository'

/**
 * Chooses Supabase when configured; otherwise local published fallback.
 * Supabase modules are loaded lazily so the public bundle stays lighter
 * when credentials are absent.
 */
export async function getProjectRepository(): Promise<PublicProjectRepository> {
  if (!isSupabaseConfigured()) return localProjectRepository
  const mod = await import('./supabaseProjectRepository')
  return mod.supabaseProjectRepository
}

export async function getServiceRepository(): Promise<PublicServiceRepository> {
  if (!isSupabaseConfigured()) return localServiceRepository
  const mod = await import('./supabaseServiceRepository')
  return mod.supabaseServiceRepository
}

export async function getAdminProjectRepository(): Promise<AdminProjectRepository> {
  if (!isSupabaseConfigured()) return localAdminProjectRepository
  const mod = await import('./supabaseProjectRepository')
  return mod.supabaseAdminProjectRepository
}

export async function getAdminServiceRepository(): Promise<AdminServiceRepository> {
  if (!isSupabaseConfigured()) return localAdminServiceRepository
  const mod = await import('./supabaseServiceRepository')
  return mod.supabaseAdminServiceRepository
}

export { localProjectRepository, localServiceRepository }
