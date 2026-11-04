import type { ContentStatus } from '../../types/content'
import type { ProjectRow, ServiceRow } from '../../types/database'
import type { Project, ProjectCategory } from '../../types/project'
import type { Service } from '../../types/service'
import { PROJECT_CATEGORIES } from '../../types/project'

export interface MappedProject extends Project {
  status: ContentStatus
  createdAt: string
  updatedAt: string
}

export interface MappedService extends Service {
  status: ContentStatus
  createdAt: string
  updatedAt: string
}

function isProjectCategory(value: string): value is ProjectCategory {
  return (PROJECT_CATEGORIES as readonly string[]).includes(value)
}

export function mapProjectRow(row: ProjectRow): MappedProject {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    category: isProjectCategory(row.category) ? row.category : 'Websites',
    technologies: row.technologies ?? [],
    coverImage: row.cover_image,
    gallery: row.gallery_images ?? [],
    liveUrl: row.live_url,
    githubUrl: row.github_url,
    featured: row.featured,
    displayOrder: row.display_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapServiceRow(row: ServiceRow): MappedService {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    iconUrl: row.icon,
    features: row.features ?? [],
    displayOrder: row.display_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Convert a public/local project into a DB-shaped row for parity testing. */
export function toProjectRow(
  project: Project,
  status: ContentStatus = 'published',
): ProjectRow {
  const now = new Date().toISOString()
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    description: project.description,
    category: project.category,
    technologies: project.technologies,
    cover_image: project.coverImage,
    gallery_images: project.gallery,
    live_url: project.liveUrl,
    github_url: project.githubUrl,
    featured: project.featured,
    display_order: project.displayOrder,
    status,
    created_at: now,
    updated_at: now,
  }
}

export function toServiceRow(
  service: Service,
  status: ContentStatus = 'published',
): ServiceRow {
  const now = new Date().toISOString()
  return {
    id: service.id,
    title: service.title,
    slug: service.slug,
    description: service.description,
    icon: service.iconUrl,
    features: service.features,
    display_order: service.displayOrder,
    status,
    created_at: now,
    updated_at: now,
  }
}
