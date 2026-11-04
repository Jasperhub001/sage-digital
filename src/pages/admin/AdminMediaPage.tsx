import { useEffect, useId, useRef, useState } from 'react'
import type { MediaAsset } from '../../lib/media/types'
import { MEDIA_ALLOWED_EXTENSIONS, MEDIA_MAX_BYTES } from '../../lib/media/constants'
import { mediaService } from '../../services/mediaService'
import './AdminMediaPage.css'

type Feedback =
  | { tone: 'success' | 'error'; message: string }
  | null

function formatBytes(size: number | null): string {
  if (size == null || !Number.isFinite(size)) return '—'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function AdminMediaPage() {
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [preview, setPreview] = useState<MediaAsset | null>(null)
  const [busyPath, setBusyPath] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const rows = await mediaService.listLibrary()
        if (cancelled) return
        setAssets(rows)
        setError(null)
      } catch (caught) {
        if (cancelled) return
        setError(
          caught instanceof Error
            ? caught.message
            : 'Unable to load the media library.',
        )
        setAssets([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || uploading) return

    const files = Array.from(fileList)
    setUploading(true)
    setFeedback(null)
    setUploadProgress(`Uploading 0 of ${files.length}…`)

    try {
      const { uploaded, failures } = await mediaService.uploadMany(
        files,
        (completed, total) => {
          setUploadProgress(`Uploading ${completed} of ${total}…`)
        },
      )

      if (uploaded.length > 0) {
        setAssets((current) => {
          const next = [...uploaded.map((item) => item.asset), ...current]
          const seen = new Set<string>()
          return next.filter((asset) => {
            if (seen.has(asset.path)) return false
            seen.add(asset.path)
            return true
          })
        })
      }

      if (failures.length === 0) {
        setFeedback({
          tone: 'success',
          message:
            uploaded.length === 1
              ? 'Image uploaded.'
              : `${uploaded.length} images uploaded.`,
        })
      } else if (uploaded.length === 0) {
        setFeedback({
          tone: 'error',
          message: failures.map((item) => `${item.fileName}: ${item.message}`).join(' '),
        })
      } else {
        setFeedback({
          tone: 'error',
          message: `${uploaded.length} uploaded. ${failures.length} failed: ${failures
            .map((item) => `${item.fileName}: ${item.message}`)
            .join(' ')}`,
        })
      }
    } catch (caught) {
      setFeedback({
        tone: 'error',
        message:
          caught instanceof Error ? caught.message : 'Upload failed.',
      })
    } finally {
      setUploading(false)
      setUploadProgress(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleCopy = async (asset: MediaAsset) => {
    try {
      await navigator.clipboard.writeText(asset.publicUrl)
      setFeedback({ tone: 'success', message: 'Public URL copied.' })
    } catch {
      setFeedback({
        tone: 'error',
        message: 'Unable to copy the URL. You can select it from the preview.',
      })
      setPreview(asset)
    }
  }

  const handleDelete = (asset: MediaAsset) => {
    const confirmed = window.confirm(
      `Delete “${asset.name}”? Projects that still reference this URL will show a broken image.`,
    )
    if (!confirmed) return

    void (async () => {
      setBusyPath(asset.path)
      setFeedback(null)
      try {
        await mediaService.remove(asset.path)
        setAssets((current) => current.filter((row) => row.path !== asset.path))
        if (preview?.path === asset.path) setPreview(null)
        setFeedback({ tone: 'success', message: 'Image deleted.' })
      } catch (caught) {
        setFeedback({
          tone: 'error',
          message:
            caught instanceof Error ? caught.message : 'Unable to delete image.',
        })
      } finally {
        setBusyPath(null)
      }
    })()
  }

  const accept = MEDIA_ALLOWED_EXTENSIONS.join(',')

  return (
    <div className="admin-media">
      <header className="admin-media__header">
        <div>
          <p className="admin-media__eyebrow">Assets</p>
          <h2 className="admin-media__title">Media Library</h2>
          <p className="admin-media__lede">
            Upload portfolio images to Supabase Storage, then select them when
            editing projects. JPEG, PNG, WebP and GIF up to{' '}
            {Math.round(MEDIA_MAX_BYTES / (1024 * 1024))} MB.
          </p>
        </div>
        <div className="admin-media__upload">
          <input
            ref={fileInputRef}
            id={inputId}
            className="admin-media__file-input"
            type="file"
            accept={accept}
            multiple
            disabled={uploading}
            onChange={(event) => {
              void handleUpload(event.target.files)
            }}
          />
          <label
            htmlFor={inputId}
            className={`admin-media__add${uploading ? ' is-disabled' : ''}`}
          >
            {uploading ? 'Uploading…' : 'Upload images'}
          </label>
        </div>
      </header>

      {uploadProgress ? (
        <p className="admin-media__progress" role="status">
          {uploadProgress}
        </p>
      ) : null}

      {feedback ? (
        <p
          className={`admin-media__feedback admin-media__feedback--${feedback.tone}`}
          role="status"
        >
          {feedback.message}
        </p>
      ) : null}

      {loading ? (
        <p className="admin-media__status" role="status">
          Loading media…
        </p>
      ) : null}

      {!loading && error ? (
        <div className="admin-media__alert" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="admin-media__retry"
            onClick={() => {
              setLoading(true)
              setReloadKey((key) => key + 1)
            }}
          >
            Try again
          </button>
        </div>
      ) : null}

      {!loading && !error && assets.length === 0 ? (
        <div className="admin-media__empty">
          <h3 className="admin-media__empty-title">No images yet</h3>
          <p className="admin-media__empty-copy">
            Upload cover and gallery images here, then choose them from the
            project editor. Apply the portfolio-media storage migration if
            uploads fail.
          </p>
        </div>
      ) : null}

      {!loading && !error && assets.length > 0 ? (
        <ul className="admin-media__grid">
          {assets.map((asset) => {
            const busy = busyPath === asset.path
            return (
              <li key={asset.path} className="admin-media__card">
                <button
                  type="button"
                  className="admin-media__preview-btn"
                  onClick={() => setPreview(asset)}
                  aria-label={`Preview ${asset.name}`}
                >
                  <img
                    src={asset.publicUrl}
                    alt=""
                    className="admin-media__thumb"
                    loading="lazy"
                  />
                </button>
                <div className="admin-media__meta">
                  <p className="admin-media__name" title={asset.name}>
                    {asset.name}
                  </p>
                  <p className="admin-media__size">{formatBytes(asset.size)}</p>
                </div>
                <div className="admin-media__actions">
                  <button
                    type="button"
                    className="admin-media__action"
                    disabled={busy}
                    onClick={() => setPreview(asset)}
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    className="admin-media__action"
                    disabled={busy}
                    onClick={() => {
                      void handleCopy(asset)
                    }}
                  >
                    Copy URL
                  </button>
                  <button
                    type="button"
                    className="admin-media__action admin-media__action--danger"
                    disabled={busy}
                    onClick={() => handleDelete(asset)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}

      {preview ? (
        <div className="admin-media-preview" role="presentation">
          <button
            type="button"
            className="admin-media-preview__backdrop"
            aria-label="Close preview"
            onClick={() => setPreview(null)}
          />
          <div
            className="admin-media-preview__dialog"
            role="dialog"
            aria-modal="true"
            aria-label={preview.name}
          >
            <img
              src={preview.publicUrl}
              alt={preview.name}
              className="admin-media-preview__image"
            />
            <p className="admin-media-preview__url">{preview.publicUrl}</p>
            <div className="admin-media-preview__actions">
              <button
                type="button"
                className="admin-media__action"
                onClick={() => {
                  void handleCopy(preview)
                }}
              >
                Copy URL
              </button>
              <button
                type="button"
                className="admin-media__action"
                onClick={() => setPreview(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AdminMediaPage
