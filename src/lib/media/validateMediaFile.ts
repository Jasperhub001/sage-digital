import {
  MEDIA_ALLOWED_EXTENSIONS,
  MEDIA_ALLOWED_MIME_TYPES,
  MEDIA_LIBRARY_PREFIX,
  MEDIA_MAX_BYTES,
  type MediaAllowedMimeType,
} from './constants'

const SVG_MIME = 'image/svg+xml'

function extensionOf(fileName: string): string | null {
  const lower = fileName.toLowerCase().trim()
  const match = MEDIA_ALLOWED_EXTENSIONS.find((ext) => lower.endsWith(ext))
  return match ?? null
}

function isSvgFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return (
    file.type === SVG_MIME ||
    name.endsWith('.svg') ||
    name.endsWith('.svgz')
  )
}

/**
 * Detect image MIME from magic bytes. Returns null when unsupported/unknown.
 * SVG is intentionally never accepted (XSS risk when served).
 */
export function sniffImageMime(
  bytes: ArrayBuffer,
): MediaAllowedMimeType | null {
  const view = new Uint8Array(bytes)
  if (view.length < 12) return null

  // JPEG
  if (view[0] === 0xff && view[1] === 0xd8 && view[2] === 0xff) {
    return 'image/jpeg'
  }

  // PNG
  if (
    view[0] === 0x89 &&
    view[1] === 0x50 &&
    view[2] === 0x4e &&
    view[3] === 0x47 &&
    view[4] === 0x0d &&
    view[5] === 0x0a &&
    view[6] === 0x1a &&
    view[7] === 0x0a
  ) {
    return 'image/png'
  }

  // GIF87a / GIF89a
  if (
    view[0] === 0x47 &&
    view[1] === 0x49 &&
    view[2] === 0x46 &&
    view[3] === 0x38 &&
    (view[4] === 0x37 || view[4] === 0x39) &&
    view[5] === 0x61
  ) {
    return 'image/gif'
  }

  // WEBP: RIFF....WEBP
  const riff =
    view[0] === 0x52 &&
    view[1] === 0x49 &&
    view[2] === 0x46 &&
    view[3] === 0x46
  const webp =
    view[8] === 0x57 &&
    view[9] === 0x45 &&
    view[10] === 0x42 &&
    view[11] === 0x50
  if (riff && webp) return 'image/webp'

  return null
}

function extensionMatchesMime(
  extension: string | null,
  mime: MediaAllowedMimeType,
): boolean {
  if (!extension) return false
  if (mime === 'image/jpeg') {
    return extension === '.jpg' || extension === '.jpeg'
  }
  if (mime === 'image/png') return extension === '.png'
  if (mime === 'image/webp') return extension === '.webp'
  if (mime === 'image/gif') return extension === '.gif'
  return false
}

export interface MediaValidationResult {
  error: string | null
  /** Authoritative MIME from magic bytes when valid. */
  detectedMime: MediaAllowedMimeType | null
}

/**
 * Validate upload candidates using size, deny-list (SVG), magic bytes, and
 * extension consistency. Never trust `file.type` or extension alone.
 */
export async function validateMediaFile(
  file: File,
): Promise<MediaValidationResult> {
  if (isSvgFile(file)) {
    return {
      error:
        'SVG uploads are not allowed. Use JPEG, PNG, WebP, or GIF instead.',
      detectedMime: null,
    }
  }

  if (file.size <= 0) {
    return { error: 'The file is empty.', detectedMime: null }
  }

  if (file.size > MEDIA_MAX_BYTES) {
    return {
      error: 'File is too large. Maximum size is 5 MB.',
      detectedMime: null,
    }
  }

  const header = await file.slice(0, 32).arrayBuffer()
  const detectedMime = sniffImageMime(header)

  if (!detectedMime) {
    return {
      error: 'Unsupported or unrecognized image file. Use JPEG, PNG, WebP, or GIF.',
      detectedMime: null,
    }
  }

  if (!MEDIA_ALLOWED_MIME_TYPES.includes(detectedMime)) {
    return {
      error: 'Unsupported file type. Use JPEG, PNG, WebP, or GIF.',
      detectedMime: null,
    }
  }

  // If the browser reports a MIME, it must agree with magic bytes (when present).
  if (
    file.type &&
    file.type !== detectedMime &&
    !(detectedMime === 'image/jpeg' && file.type === 'image/jpg')
  ) {
    return {
      error: 'File content does not match the declared type.',
      detectedMime: null,
    }
  }

  const extension = extensionOf(file.name)
  if (!extensionMatchesMime(extension, detectedMime)) {
    return {
      error: 'File extension does not match the image type.',
      detectedMime: null,
    }
  }

  return { error: null, detectedMime }
}

export function sanitizeOriginalFileName(fileName: string): string {
  const trimmed = fileName.trim() || 'image'
  const cleaned = trimmed
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned.slice(0, 80) || 'image'
}

export function buildUniqueObjectPath(
  file: File,
  detectedMime: MediaAllowedMimeType,
): string {
  const safeName = sanitizeOriginalFileName(file.name)
  const unique = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
  // Prefer a canonical extension derived from sniffed MIME.
  const ext =
    detectedMime === 'image/jpeg'
      ? '.jpg'
      : detectedMime === 'image/png'
        ? '.png'
        : detectedMime === 'image/webp'
          ? '.webp'
          : '.gif'
  const base = safeName.replace(/\.[A-Za-z0-9]+$/, '')
  return `${MEDIA_LIBRARY_PREFIX}/${unique}-${base}${ext}`
}

/** Reject path traversal / non-library targets before Storage delete/upload. */
export function assertLibraryObjectPath(path: string): void {
  const normalized = path.replace(/\\/g, '/').trim()
  if (
    !normalized.startsWith(`${MEDIA_LIBRARY_PREFIX}/`) ||
    normalized.includes('..') ||
    normalized.includes('//') ||
    normalized.length > 500
  ) {
    throw new Error('Invalid media path.')
  }
}
