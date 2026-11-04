/**
 * Public project shape shared by the UI and the data layer.
 * Designed to map cleanly onto a future Supabase `projects` table.
 *
 * Draft / unpublished projects must never enter the public data source
 * or this application's public bundle.
 */
export const PROJECT_CATEGORIES = [
  'Websites',
  'Landing Pages',
  'AI Integrations',
  'Automation',
] as const

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]

export const PROJECT_CATEGORY_FILTERS = [
  'All',
  ...PROJECT_CATEGORIES,
] as const

export type ProjectCategoryFilter = (typeof PROJECT_CATEGORY_FILTERS)[number]

export interface Project {
  id: string
  title: string
  slug: string
  description: string
  category: ProjectCategory
  technologies: string[]
  coverImage: string
  gallery: string[]
  liveUrl: string | null
  githubUrl: string | null
  featured: boolean
  displayOrder: number
}
