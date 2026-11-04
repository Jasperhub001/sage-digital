import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase/client'

export type OverviewMetric =
  | { status: 'ready'; value: number }
  | { status: 'unavailable'; reason: string }
  | { status: 'error'; reason: string }

export interface AdminOverviewStats {
  publishedProjects: OverviewMetric
  draftProjects: OverviewMetric
  publishedServices: OverviewMetric
  totalInquiries: OverviewMetric
}

const NOT_CONFIGURED =
  'Supabase is not configured in this environment.'

const COUNT_FAILED = 'Unable to load this metric.'

async function countByStatus(
  table: 'projects' | 'services',
  status: 'published' | 'draft',
): Promise<OverviewMetric> {
  const client = await getSupabaseClient()
  if (!client) {
    return { status: 'unavailable', reason: NOT_CONFIGURED }
  }

  const { count, error } = await client
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('status', status)

  if (error) {
    return { status: 'error', reason: COUNT_FAILED }
  }

  return { status: 'ready', value: count ?? 0 }
}

async function countInquiries(): Promise<OverviewMetric> {
  const client = await getSupabaseClient()
  if (!client) {
    return { status: 'unavailable', reason: NOT_CONFIGURED }
  }

  const { count, error } = await client
    .from('inquiries')
    .select('id', { count: 'exact', head: true })

  if (error) {
    return {
      status: 'error',
      reason:
        'Unable to load inquiries. Confirm the inquiries migration is applied.',
    }
  }

  return { status: 'ready', value: count ?? 0 }
}

/**
 * Efficient head-count queries for the admin overview.
 * Relies on authenticated admin RLS (select all) — never fabricates values.
 */
export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  if (!isSupabaseConfigured()) {
    const unavailable: OverviewMetric = {
      status: 'unavailable',
      reason: NOT_CONFIGURED,
    }
    return {
      publishedProjects: unavailable,
      draftProjects: unavailable,
      publishedServices: unavailable,
      totalInquiries: unavailable,
    }
  }

  const [publishedProjects, draftProjects, publishedServices, totalInquiries] =
    await Promise.all([
      countByStatus('projects', 'published'),
      countByStatus('projects', 'draft'),
      countByStatus('services', 'published'),
      countInquiries(),
    ])

  return {
    publishedProjects,
    draftProjects,
    publishedServices,
    totalInquiries,
  }
}
