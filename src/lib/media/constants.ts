/** Public Supabase Storage bucket for portfolio images (Stage 9.5). */
export const PORTFOLIO_MEDIA_BUCKET = 'portfolio-media' as const

/** Folder prefix inside the bucket for library uploads. */
export const MEDIA_LIBRARY_PREFIX = 'library' as const

export const MEDIA_MAX_BYTES = 5 * 1024 * 1024

export const MEDIA_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export type MediaAllowedMimeType = (typeof MEDIA_ALLOWED_MIME_TYPES)[number]

export const MEDIA_ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
] as const
