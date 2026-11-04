import { useEffect, useId, useState } from 'react'
import type { MediaAsset } from '../../lib/media/types'
import { mediaService } from '../../services/mediaService'
import './MediaPickerModal.css'

interface MediaPickerModalProps {
  title: string
  mode: 'single' | 'multiple'
  selectedUrls: string[]
  onClose: () => void
  onConfirm: (urls: string[]) => void
}

function MediaPickerModal({
  title,
  mode,
  selectedUrls,
  onClose,
  onConfirm,
}: MediaPickerModalProps) {
  const titleId = useId()
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [picked, setPicked] = useState<string[]>(selectedUrls)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const rows = await mediaService.listLibrary()
        if (!cancelled) {
          setAssets(rows)
          setError(null)
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : 'Unable to load media library.',
          )
          setAssets([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [onClose])

  const toggle = (url: string) => {
    if (mode === 'single') {
      setPicked([url])
      return
    }
    setPicked((current) =>
      current.includes(url)
        ? current.filter((item) => item !== url)
        : [...current, url],
    )
  }

  return (
    <div className="media-picker" role="presentation">
      <button
        type="button"
        className="media-picker__backdrop"
        aria-label="Close media picker"
        onClick={onClose}
      />
      <div
        className="media-picker__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="media-picker__header">
          <h2 id={titleId} className="media-picker__title">
            {title}
          </h2>
          <button
            type="button"
            className="media-picker__close"
            onClick={onClose}
          >
            Close
          </button>
        </header>

        <div className="media-picker__body">
          {loading ? (
            <p className="media-picker__status" role="status">
              Loading library…
            </p>
          ) : null}
          {error ? (
            <p className="media-picker__alert" role="alert">
              {error}
            </p>
          ) : null}
          {!loading && !error && assets.length === 0 ? (
            <p className="media-picker__status">
              No images in the library yet. Upload files from Media Library
              first.
            </p>
          ) : null}
          {!loading && assets.length > 0 ? (
            <ul className="media-picker__grid">
              {assets.map((asset) => {
                const selected = picked.includes(asset.publicUrl)
                return (
                  <li key={asset.path}>
                    <button
                      type="button"
                      className={`media-picker__card${selected ? ' is-selected' : ''}`}
                      onClick={() => toggle(asset.publicUrl)}
                      aria-pressed={selected}
                    >
                      <img
                        src={asset.publicUrl}
                        alt=""
                        className="media-picker__thumb"
                        loading="lazy"
                      />
                      <span className="media-picker__name">{asset.name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>

        <footer className="media-picker__footer">
          <button
            type="button"
            className="media-picker__button media-picker__button--ghost"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="media-picker__button media-picker__button--primary"
            disabled={mode === 'single' && picked.length === 0}
            onClick={() => onConfirm(picked)}
          >
            {mode === 'single' ? 'Use selected image' : 'Add selected images'}
          </button>
        </footer>
      </div>
    </div>
  )
}

export default MediaPickerModal
