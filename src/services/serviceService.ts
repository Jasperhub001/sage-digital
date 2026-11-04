import { logContentDataSource } from '../lib/content/dataSourceLog'
import { localServiceRepository } from '../lib/content/localServiceRepository'
import { getServiceRepository } from '../lib/content/repositories'
import { isSupabaseConfigured } from '../lib/supabase/client'
import type { Service } from '../types/service'

/**
 * Public service API used by UI components.
 * Prefers Supabase when configured; falls back to local published data.
 */
export interface ServiceService {
  getPublishedServices: () => Promise<Service[]>
  getServiceBySlug: (slug: string) => Promise<Service | null>
}

async function withServiceFallback<T>(
  operation: () => Promise<T>,
  fallback: () => Promise<T>,
  options?: { trackCount?: boolean },
): Promise<T> {
  if (!isSupabaseConfigured()) {
    const result = await fallback()
    logContentDataSource('services', 'local-fallback', {
      reason: 'supabase-not-configured',
      count: options?.trackCount && Array.isArray(result) ? result.length : undefined,
    })
    return result
  }

  try {
    const result = await operation()
    logContentDataSource('services', 'supabase', {
      count: options?.trackCount && Array.isArray(result) ? result.length : undefined,
    })
    return result
  } catch (error) {
    const reason =
      error instanceof Error ? error.name || 'Error' : 'unknown-error'
    console.warn(
      '[serviceService] Supabase read failed; using local published services.',
      reason,
    )
    const result = await fallback()
    logContentDataSource('services', 'local-fallback-after-error', {
      reason,
      count: options?.trackCount && Array.isArray(result) ? result.length : undefined,
    })
    return result
  }
}

export const serviceService: ServiceService = {
  async getPublishedServices() {
    return withServiceFallback(
      async () => (await getServiceRepository()).listPublished(),
      () => localServiceRepository.listPublished(),
      { trackCount: true },
    )
  },

  async getServiceBySlug(slug) {
    return withServiceFallback(
      async () => (await getServiceRepository()).getBySlug(slug),
      () => localServiceRepository.getBySlug(slug),
    )
  },
}

export const getPublishedServices = () => serviceService.getPublishedServices()
export const getServiceBySlug = (slug: string) =>
  serviceService.getServiceBySlug(slug)
