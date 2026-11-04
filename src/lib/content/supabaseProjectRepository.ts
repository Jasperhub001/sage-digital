import type { ContentStatus } from '../../types/content'
import type {
  ProjectInsert,
  ProjectRow,
  ProjectUpdate,
} from '../../types/database'
import {
  PROJECT_CATEGORIES,
  type ProjectCategoryFilter,
} from '../../types/project'
import { getSupabaseClient } from '../supabase/client'
import type {
  AdminProjectRecord,
  AdminProjectRepository,
  PublicProjectRecord,
  PublicProjectRepository,
} from './contracts'
import { mapProjectRow } from './mappers'

async function requireClient() {
  const client = await getSupabaseClient()
  if (!client) {
    throw new Error('Supabase is not configured.')
  }
  return client
}

function toAdmin(row: ProjectRow): AdminProjectRecord {
  return mapProjectRow(row)
}

function mapProjectWriteError(error: {
  code?: string
  message?: string
}): Error {
  if (error.code === '23505') {
    return new Error(
      'A project with this slug already exists. Choose a different slug.',
    )
  }

  return new Error(
    error.message?.trim()
      ? 'Unable to save the project. Please review the fields and try again.'
      : 'Unable to save the project.',
  )
}

function toPublic(row: ProjectRow): PublicProjectRecord | null {
  if (row.status !== 'published') return null
  const mapped = mapProjectRow(row)
  return { ...mapped, status: 'published' }
}

export const supabaseProjectRepository: PublicProjectRepository = {
  async listPublished() {
    const client = await requireClient()
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('status', 'published')
      .order('display_order', { ascending: true })
      .order('featured', { ascending: false })

    if (error) throw error

    return (data ?? [])
      .map((row) => toPublic(row as ProjectRow))
      .filter((row): row is PublicProjectRecord => row !== null)
  },

  async listFeatured() {
    const projects = await this.listPublished()
    return projects.filter((project) => project.featured)
  },

  async getBySlug(slug) {
    const client = await requireClient()
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('status', 'published')
      .eq('slug', slug)
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    return toPublic(data as ProjectRow)
  },

  async listByCategory(category: ProjectCategoryFilter) {
    const projects = await this.listPublished()
    if (category === 'All') return projects
    return projects.filter((project) => project.category === category)
  },

  async listCategories() {
    return [...PROJECT_CATEGORIES]
  },
}

/**
 * Administrator repository — requires authenticated admin session + RLS.
 * Never call from public pages.
 */
export const supabaseAdminProjectRepository: AdminProjectRepository = {
  async listAll() {
    const client = await requireClient()
    const { data, error } = await client
      .from('projects')
      .select('*')
      .order('display_order', { ascending: true })
      .order('updated_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map((row) => toAdmin(row as ProjectRow))
  },

  async getById(id) {
    const client = await requireClient()
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    return toAdmin(data as ProjectRow)
  },

  async create(payload: ProjectInsert) {
    const client = await requireClient()
    // Cast: hand-written Database generics can widen mutation builders to `never`.
    const { data, error } = await client
      .from('projects')
      .insert(payload as never)
      .select('*')
      .single()

    if (error) throw mapProjectWriteError(error)
    return toAdmin(data as ProjectRow)
  },

  async update(id, payload: ProjectUpdate) {
    const client = await requireClient()
    const { data, error } = await client
      .from('projects')
      .update(payload as never)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw mapProjectWriteError(error)
    return toAdmin(data as ProjectRow)
  },

  async remove(id) {
    const client = await requireClient()
    const { error } = await client.from('projects').delete().eq('id', id)
    if (error) throw error
  },

  async setStatus(id, status: ContentStatus) {
    return this.update(id, { status })
  },

  async setFeatured(id, featured) {
    return this.update(id, { featured })
  },

  async reorder(orderedIds) {
    const client = await requireClient()

    // Sequential updates keep display_order aligned with the given order.
    for (let index = 0; index < orderedIds.length; index += 1) {
      const id = orderedIds[index]
      if (!id) continue
      const { error } = await client
        .from('projects')
        .update({ display_order: index + 1 } as never)
        .eq('id', id)
      if (error) throw error
    }
  },
}
