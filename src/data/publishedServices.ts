import type { Service } from '../types/service'

/**
 * Local fallback — published services only.
 * Used when Supabase env vars are missing or a remote read fails.
 * Features stay empty until real content is supplied via admin/CMS.
 */
export const publishedServices: Service[] = [
  {
    id: 'svc_websites',
    slug: 'website-development',
    title: 'Website Development',
    description:
      'Custom, performance-minded websites that present your brand with clarity and convert visitors into clients.',
    iconUrl: null,
    features: [],
    displayOrder: 1,
  },
  {
    id: 'svc_landing_pages',
    slug: 'landing-page-development',
    title: 'Landing Page Development',
    description:
      'Focused campaign pages built around a single offer — sharp messaging, persuasive structure, and measurable results.',
    iconUrl: null,
    features: [],
    displayOrder: 2,
  },
  {
    id: 'svc_ai_integrations',
    slug: 'ai-integrations',
    title: 'AI Integrations',
    description:
      'Practical AI woven into your product or operations — assistants, workflows, and tools that save time without complexity.',
    iconUrl: null,
    features: [],
    displayOrder: 3,
  },
  {
    id: 'svc_automation',
    slug: 'business-automation',
    title: 'Business Automation',
    description:
      'Connected systems that remove repetitive work across CRM, billing, reporting, and client communication.',
    iconUrl: null,
    features: [],
    displayOrder: 4,
  },
]
