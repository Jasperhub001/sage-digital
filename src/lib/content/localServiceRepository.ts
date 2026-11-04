import { publishedServices } from '../../data/publishedServices'
import type { Service } from '../../types/service'
import type {
  AdminServiceRepository,
  PublicServiceRecord,
  PublicServiceRepository,
} from './contracts'
import { adminNotReady } from './contracts'

function sortByDisplayOrder(services: Service[]): Service[] {
  return [...services].sort((a, b) => {
    if (a.displayOrder === b.displayOrder) {
      return a.title.localeCompare(b.title)
    }
    return a.displayOrder - b.displayOrder
  })
}

function asPublished(service: Service): PublicServiceRecord {
  return { ...service, status: 'published' }
}

async function readPublished(): Promise<PublicServiceRecord[]> {
  return sortByDisplayOrder(
    publishedServices.map((service) => ({ ...service })),
  ).map(asPublished)
}

export const localServiceRepository: PublicServiceRepository = {
  async listPublished() {
    return readPublished()
  },

  async getBySlug(slug) {
    const services = await readPublished()
    return services.find((service) => service.slug === slug) ?? null
  },
}

export const localAdminServiceRepository: AdminServiceRepository = {
  listAll: async () => adminNotReady('Listing admin services'),
  getById: async () => adminNotReady('Loading an admin service'),
  create: async () => adminNotReady('Creating services'),
  update: async () => adminNotReady('Updating services'),
  remove: async () => adminNotReady('Deleting services'),
  setStatus: async () => adminNotReady('Changing service status'),
  reorder: async () => adminNotReady('Reordering services'),
}
