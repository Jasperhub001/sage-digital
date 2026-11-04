import type { ContentStatus } from '../types/content'
import type { AdminProjectRecord } from '../lib/content/contracts'
import { getAdminProjectRepository } from '../lib/content/repositories'
import {
  formValuesToInsert,
  formValuesToUpdate,
  type AdminProjectFormValues,
} from '../lib/admin/projectForm'
import { isSupabaseConfigured } from '../lib/supabase/client'

async function requireAdminProjectRepository() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Project management requires Supabase configuration and an administrator session.',
    )
  }
  return getAdminProjectRepository()
}

export const adminProjectService = {
  async listAll(): Promise<AdminProjectRecord[]> {
    const repo = await requireAdminProjectRepository()
    return repo.listAll()
  },

  async getById(id: string): Promise<AdminProjectRecord | null> {
    const repo = await requireAdminProjectRepository()
    return repo.getById(id)
  },

  async create(
    values: AdminProjectFormValues,
  ): Promise<AdminProjectRecord> {
    const repo = await requireAdminProjectRepository()
    return repo.create(formValuesToInsert(values))
  },

  async update(
    id: string,
    values: AdminProjectFormValues,
  ): Promise<AdminProjectRecord> {
    const repo = await requireAdminProjectRepository()
    return repo.update(id, formValuesToUpdate(values))
  },

  async remove(id: string): Promise<void> {
    const repo = await requireAdminProjectRepository()
    return repo.remove(id)
  },

  async setStatus(
    id: string,
    status: ContentStatus,
  ): Promise<AdminProjectRecord> {
    const repo = await requireAdminProjectRepository()
    return repo.setStatus(id, status)
  },

  async setFeatured(
    id: string,
    featured: boolean,
  ): Promise<AdminProjectRecord> {
    const repo = await requireAdminProjectRepository()
    return repo.setFeatured(id, featured)
  },

  async reorder(orderedIds: string[]): Promise<void> {
    const repo = await requireAdminProjectRepository()
    return repo.reorder(orderedIds)
  },

  async move(id: string, direction: 'up' | 'down'): Promise<AdminProjectRecord[]> {
    const repo = await requireAdminProjectRepository()
    const projects = await repo.listAll()
    const index = projects.findIndex((project) => project.id === id)
    if (index < 0) return projects

    const swapWith = direction === 'up' ? index - 1 : index + 1
    if (swapWith < 0 || swapWith >= projects.length) return projects

    const orderedIds = projects.map((project) => project.id)
    const current = orderedIds[index]
    const other = orderedIds[swapWith]
    if (!current || !other) return projects

    orderedIds[index] = other
    orderedIds[swapWith] = current

    await repo.reorder(orderedIds)
    return repo.listAll()
  },
}
