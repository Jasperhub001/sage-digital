import {
  MEDIA_LIBRARY_PREFIX,
  PORTFOLIO_MEDIA_BUCKET,
} from '../lib/media/constants'
import type { MediaAsset, MediaUploadResult } from '../lib/media/types'
import {
  assertLibraryObjectPath,
  buildUniqueObjectPath,
  validateMediaFile,
} from '../lib/media/validateMediaFile'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase/client'

async function requireClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Media management requires Supabase configuration and an administrator session.',
    )
  }
  const client = await getSupabaseClient()
  if (!client) {
    throw new Error(
      'Media management requires Supabase configuration and an administrator session.',
    )
  }
  return client
}

function toPublicUrl(path: string, client: Awaited<ReturnType<typeof requireClient>>) {
  const { data } = client.storage.from(PORTFOLIO_MEDIA_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

function isListedFile(entry: {
  id: string | null
  name: string
  metadata?: Record<string, unknown> | null
}): boolean {
  if (!entry.name || entry.name.endsWith('/')) return false
  if (entry.name === '.emptyFolderPlaceholder') return false
  if (entry.id === null && !entry.metadata) return false
  return true
}

export const mediaService = {
  bucket: PORTFOLIO_MEDIA_BUCKET,

  async listLibrary(): Promise<MediaAsset[]> {
    const client = await requireClient()
    const { data, error } = await client.storage
      .from(PORTFOLIO_MEDIA_BUCKET)
      .list(MEDIA_LIBRARY_PREFIX, {
        limit: 200,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) {
      throw new Error(
        error.message.includes('not found') || error.message.includes('Bucket')
          ? 'Media bucket is not available. Apply the portfolio-media storage migration first.'
          : 'Unable to load the media library.',
      )
    }

    return (data ?? [])
      .filter(isListedFile)
      .map((entry) => {
        const path = `${MEDIA_LIBRARY_PREFIX}/${entry.name}`
        const sizeValue = entry.metadata?.size
        const size =
          typeof sizeValue === 'number'
            ? sizeValue
            : typeof sizeValue === 'string'
              ? Number(sizeValue) || null
              : null

        const asset: MediaAsset = {
          path,
          name: entry.name,
          publicUrl: toPublicUrl(path, client),
          size,
          updatedAt: entry.updated_at ?? entry.created_at ?? null,
        }
        return asset
      })
  },

  async upload(file: File): Promise<MediaUploadResult> {
    const validation = await validateMediaFile(file)
    if (validation.error || !validation.detectedMime) {
      throw new Error(validation.error ?? 'Unsupported file type.')
    }

    const client = await requireClient()
    const path = buildUniqueObjectPath(file, validation.detectedMime)
    assertLibraryObjectPath(path)

    const { error } = await client.storage
      .from(PORTFOLIO_MEDIA_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: validation.detectedMime,
      })

    if (error) {
      throw new Error(
        error.message.includes('row-level security') ||
          error.message.toLowerCase().includes('policy')
          ? 'Upload denied. Confirm you are signed in as an administrator and storage policies are applied.'
          : 'Upload failed. Please try again.',
      )
    }

    return {
      fileName: file.name,
      asset: {
        path,
        name: path.split('/').pop() ?? path,
        publicUrl: toPublicUrl(path, client),
        size: file.size,
        updatedAt: new Date().toISOString(),
      },
    }
  },

  async uploadMany(
    files: File[],
    onProgress?: (completed: number, total: number) => void,
  ): Promise<{ uploaded: MediaUploadResult[]; failures: { fileName: string; message: string }[] }> {
    const uploaded: MediaUploadResult[] = []
    const failures: { fileName: string; message: string }[] = []
    const total = files.length

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index]
      if (!file) continue
      try {
        const result = await this.upload(file)
        uploaded.push(result)
      } catch (caught) {
        failures.push({
          fileName: file.name,
          message:
            caught instanceof Error ? caught.message : 'Upload failed.',
        })
      }
      onProgress?.(index + 1, total)
    }

    return { uploaded, failures }
  },

  async remove(path: string): Promise<void> {
    assertLibraryObjectPath(path)
    const client = await requireClient()
    const { error } = await client.storage
      .from(PORTFOLIO_MEDIA_BUCKET)
      .remove([path])

    if (error) {
      throw new Error('Unable to delete that image.')
    }
  },
}
