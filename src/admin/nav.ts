export interface AdminNavItem {
  to: string
  label: string
  /** Exact match for the overview index route */
  end?: boolean
  description: string
}

export const ADMIN_NAV: readonly AdminNavItem[] = [
  {
    to: '/admin',
    label: 'Overview',
    end: true,
    description: 'Dashboard summary and content health.',
  },
  {
    to: '/admin/projects',
    label: 'Projects',
    description: 'Manage portfolio projects and publish state.',
  },
  {
    to: '/admin/services',
    label: 'Services',
    description: 'Manage studio service offerings.',
  },
  {
    to: '/admin/media',
    label: 'Media Library',
    description: 'Browse and organize uploaded media.',
  },
  {
    to: '/admin/inquiries',
    label: 'Inquiries',
    description: 'Review contact form submissions.',
  },
  {
    to: '/admin/settings',
    label: 'Settings',
    description: 'Public website business details and presentation.',
  },
] as const
