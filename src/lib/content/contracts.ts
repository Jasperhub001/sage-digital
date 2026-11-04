import type { ContentStatus } from '../../types/content'
import type {
  ProjectInsert,
  ProjectUpdate,
  ServiceInsert,
  ServiceUpdate,
} from '../../types/database'
import type { Project, ProjectCategory, ProjectCategoryFilter } from '../../types/project'
import type { Service } from '../../types/service'

/**
 * Repository contracts for content access.
 *
 * Public methods must only return published records.
 * Admin mutation methods are stubs until authentication + admin UI exist.
 *
 * IMPORTANT: Frontend `status = published` filtering is not security by itself.
 * Supabase Row Level Security must enforce public SELECT for published rows only,
 * and must deny public INSERT/UPDATE/DELETE.
 */

export interface PublicProjectRecord extends Project {
  status: Extract<ContentStatus, 'published'>
}

export interface PublicServiceRecord extends Service {
  status: Extract<ContentStatus, 'published'>
}

export interface PublicProjectRepository {
  listPublished: () => Promise<PublicProjectRecord[]>
  listFeatured: () => Promise<PublicProjectRecord[]>
  getBySlug: (slug: string) => Promise<PublicProjectRecord | null>
  listByCategory: (
    category: ProjectCategoryFilter,
  ) => Promise<PublicProjectRecord[]>
  listCategories: () => Promise<ProjectCategory[]>
}

export interface PublicServiceRepository {
  listPublished: () => Promise<PublicServiceRecord[]>
  getBySlug: (slug: string) => Promise<PublicServiceRecord | null>
}

/** Full project record for authenticated administrators (includes drafts). */
export interface AdminProjectRecord extends Project {
  status: ContentStatus
  createdAt: string
  updatedAt: string
}

/**
 * Authenticated administrator operations.
 * Public pages must never call these — RLS still enforces server-side.
 */
export interface AdminProjectRepository {
  listAll: () => Promise<AdminProjectRecord[]>
  getById: (id: string) => Promise<AdminProjectRecord | null>
  create: (payload: ProjectInsert) => Promise<AdminProjectRecord>
  update: (id: string, payload: ProjectUpdate) => Promise<AdminProjectRecord>
  remove: (id: string) => Promise<void>
  setStatus: (id: string, status: ContentStatus) => Promise<AdminProjectRecord>
  setFeatured: (
    id: string,
    featured: boolean,
  ) => Promise<AdminProjectRecord>
  reorder: (orderedIds: string[]) => Promise<void>
}

/** Full service record for authenticated administrators (includes drafts). */
export interface AdminServiceRecord extends Service {
  status: ContentStatus
  createdAt: string
  updatedAt: string
}

export interface AdminServiceRepository {
  listAll: () => Promise<AdminServiceRecord[]>
  getById: (id: string) => Promise<AdminServiceRecord | null>
  create: (payload: ServiceInsert) => Promise<AdminServiceRecord>
  update: (id: string, payload: ServiceUpdate) => Promise<AdminServiceRecord>
  remove: (id: string) => Promise<void>
  setStatus: (id: string, status: ContentStatus) => Promise<AdminServiceRecord>
  reorder: (orderedIds: string[]) => Promise<void>
}

/** Path conventions inside the `portfolio-media` public bucket. */
export const STORAGE_PATHS = {
  library: 'library',
  projectCovers: 'projects/covers',
  projectGallery: 'projects/gallery',
  serviceIcons: 'services/icons',
} as const

export function adminNotReady(feature: string): never {
  throw new Error(
    `${feature} is reserved for the future admin dashboard with authenticated Supabase access.`,
  )
}
