import { publishedProjects } from '../../data/publishedProjects'
import {
  PROJECT_CATEGORIES,
  type Project,
  type ProjectCategoryFilter,
} from '../../types/project'
import type {
  AdminProjectRepository,
  PublicProjectRecord,
  PublicProjectRepository,
} from './contracts'
import { adminNotReady } from './contracts'

function sortForShowcase(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder
    }
    if (a.featured !== b.featured) {
      return Number(b.featured) - Number(a.featured)
    }
    return a.title.localeCompare(b.title)
  })
}

function asPublished(project: Project): PublicProjectRecord {
  return { ...project, status: 'published' }
}

async function readPublished(): Promise<PublicProjectRecord[]> {
  return sortForShowcase(publishedProjects.map((project) => ({ ...project }))).map(
    asPublished,
  )
}

export const localProjectRepository: PublicProjectRepository = {
  async listPublished() {
    return readPublished()
  },

  async listFeatured() {
    const projects = await readPublished()
    return projects.filter((project) => project.featured)
  },

  async getBySlug(slug) {
    const projects = await readPublished()
    return projects.find((project) => project.slug === slug) ?? null
  },

  async listByCategory(category: ProjectCategoryFilter) {
    const projects = await readPublished()
    if (category === 'All') return projects
    return projects.filter((project) => project.category === category)
  },

  async listCategories() {
    return [...PROJECT_CATEGORIES]
  },
}

export const localAdminProjectRepository: AdminProjectRepository = {
  listAll: async () => adminNotReady('Listing admin projects'),
  getById: async () => adminNotReady('Loading an admin project'),
  create: async () => adminNotReady('Creating projects'),
  update: async () => adminNotReady('Updating projects'),
  remove: async () => adminNotReady('Deleting projects'),
  setStatus: async () => adminNotReady('Changing project status'),
  setFeatured: async () => adminNotReady('Featuring projects'),
  reorder: async () => adminNotReady('Reordering projects'),
}
