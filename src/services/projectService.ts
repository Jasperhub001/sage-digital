import { logContentDataSource } from '../lib/content/dataSourceLog'
import { localProjectRepository } from '../lib/content/localProjectRepository'
import { getProjectRepository } from '../lib/content/repositories'
import { isSupabaseConfigured } from '../lib/supabase/client'
import {
  PROJECT_CATEGORY_FILTERS,
  type Project,
  type ProjectCategory,
  type ProjectCategoryFilter,
} from '../types/project'

/**
 * Public project API used by UI components.
 * Prefers Supabase when configured; falls back to local published data.
 */
export interface ProjectService {
  getPublishedProjects: () => Promise<Project[]>
  getFeaturedProjects: () => Promise<Project[]>
  getProjectBySlug: (slug: string) => Promise<Project | null>
  getProjectsByCategory: (
    category: ProjectCategoryFilter,
  ) => Promise<Project[]>
  getCategories: () => Promise<ProjectCategory[]>
  getCategoryFilters: () => Promise<readonly ProjectCategoryFilter[]>
}

async function withProjectFallback<T>(
  operation: () => Promise<T>,
  fallback: () => Promise<T>,
  options?: { trackCount?: boolean },
): Promise<T> {
  if (!isSupabaseConfigured()) {
    const result = await fallback()
    logContentDataSource('projects', 'local-fallback', {
      reason: 'supabase-not-configured',
      count: options?.trackCount && Array.isArray(result) ? result.length : undefined,
    })
    return result
  }

  try {
    const result = await operation()
    logContentDataSource('projects', 'supabase', {
      count: options?.trackCount && Array.isArray(result) ? result.length : undefined,
    })
    return result
  } catch (error) {
    const reason =
      error instanceof Error ? error.name || 'Error' : 'unknown-error'
    console.warn(
      '[projectService] Supabase read failed; using local published projects.',
      reason,
    )
    const result = await fallback()
    logContentDataSource('projects', 'local-fallback-after-error', {
      reason,
      count: options?.trackCount && Array.isArray(result) ? result.length : undefined,
    })
    return result
  }
}

export const projectService: ProjectService = {
  async getPublishedProjects() {
    return withProjectFallback(
      async () => (await getProjectRepository()).listPublished(),
      () => localProjectRepository.listPublished(),
      { trackCount: true },
    )
  },

  async getFeaturedProjects() {
    return withProjectFallback(
      async () => (await getProjectRepository()).listFeatured(),
      () => localProjectRepository.listFeatured(),
    )
  },

  async getProjectBySlug(slug) {
    return withProjectFallback(
      async () => (await getProjectRepository()).getBySlug(slug),
      () => localProjectRepository.getBySlug(slug),
    )
  },

  async getProjectsByCategory(category) {
    return withProjectFallback(
      async () => (await getProjectRepository()).listByCategory(category),
      () => localProjectRepository.listByCategory(category),
      { trackCount: true },
    )
  },

  async getCategories() {
    return withProjectFallback(
      async () => (await getProjectRepository()).listCategories(),
      () => localProjectRepository.listCategories(),
    )
  },

  async getCategoryFilters() {
    return PROJECT_CATEGORY_FILTERS
  },
}

export const getPublishedProjects = () => projectService.getPublishedProjects()
export const getFeaturedProjects = () => projectService.getFeaturedProjects()
export const getProjectBySlug = (slug: string) =>
  projectService.getProjectBySlug(slug)
export const getProjectsByCategory = (category: ProjectCategoryFilter) =>
  projectService.getProjectsByCategory(category)
export const getCategories = () => projectService.getCategories()
export const getCategoryFilters = () => projectService.getCategoryFilters()
