import type { Project } from '../types/project'

/**
 * Local fallback — published projects only.
 * Used when Supabase env vars are missing or a remote read fails.
 * Drafts must never be added here.
 */
export const publishedProjects: Project[] = [
  {
    id: 'proj_sage_study_planner',
    title: 'SÅGÊ Study Planner',
    slug: 'sage-study-planner',
    description:
      'A student-focused study planning platform designed to help tertiary students organise subjects, manage availability and generate structured study schedules.',
    category: 'Websites',
    technologies: ['React', 'TypeScript', 'Vite'],
    coverImage: '/images/projects/sage-study-planner-cover.svg',
    gallery: [
      '/images/projects/sage-study-planner-1.svg',
      '/images/projects/sage-study-planner-2.svg',
    ],
    liveUrl: 'https://sage-study-planner.vercel.app/',
    githubUrl: null,
    featured: true,
    displayOrder: 1,
  },
]
