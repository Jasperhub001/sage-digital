import type { ContentStatus } from '../types/content'
import type { AdminServiceRecord } from '../lib/content/contracts'
import { getAdminServiceRepository } from '../lib/content/repositories'
import {
  formValuesToServiceInsert,
  formValuesToServiceUpdate,
  type AdminServiceFormValues,
} from '../lib/admin/serviceForm'
import { isSupabaseConfigured } from '../lib/supabase/client'

async function requireAdminServiceRepository() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Service management requires Supabase configuration and an administrator session.',
    )
  }
  return getAdminServiceRepository()
}

export const adminServiceService = {
  async listAll(): Promise<AdminServiceRecord[]> {
    const repo = await requireAdminServiceRepository()
    return repo.listAll()
  },

  async getById(id: string): Promise<AdminServiceRecord | null> {
    const repo = await requireAdminServiceRepository()
    return repo.getById(id)
  },

  async create(
    values: AdminServiceFormValues,
  ): Promise<AdminServiceRecord> {
    const repo = await requireAdminServiceRepository()
    return repo.create(formValuesToServiceInsert(values))
  },

  async update(
    id: string,
    values: AdminServiceFormValues,
  ): Promise<AdminServiceRecord> {
    const repo = await requireAdminServiceRepository()
    return repo.update(id, formValuesToServiceUpdate(values))
  },

  async remove(id: string): Promise<void> {
    const repo = await requireAdminServiceRepository()
    return repo.remove(id)
  },

  async setStatus(
    id: string,
    status: ContentStatus,
  ): Promise<AdminServiceRecord> {
    const repo = await requireAdminServiceRepository()
    return repo.setStatus(id, status)
  },

  async reorder(orderedIds: string[]): Promise<void> {
    const repo = await requireAdminServiceRepository()
    return repo.reorder(orderedIds)
  },

  async move(
    id: string,
    direction: 'up' | 'down',
  ): Promise<AdminServiceRecord[]> {
    const repo = await requireAdminServiceRepository()
    const services = await repo.listAll()
    const index = services.findIndex((service) => service.id === id)
    if (index < 0) return services

    const swapWith = direction === 'up' ? index - 1 : index + 1
    if (swapWith < 0 || swapWith >= services.length) return services

    const orderedIds = services.map((service) => service.id)
    const current = orderedIds[index]
    const other = orderedIds[swapWith]
    if (!current || !other) return services

    orderedIds[index] = other
    orderedIds[swapWith] = current

    await repo.reorder(orderedIds)
    return repo.listAll()
  },
}
