import { useId, useState, type FormEvent } from 'react'
import {
  PROJECT_CATEGORIES,
  type ProjectCategory,
} from '../../types/project'
import type { ContentStatus } from '../../types/content'
import {
  suggestSlugFromTitle,
  type AdminProjectFormErrors,
  type AdminProjectFormValues,
} from '../../lib/admin/projectForm'
import MediaPickerModal from './MediaPickerModal'
import './AdminProjectForm.css'

interface AdminProjectFormProps {
  values: AdminProjectFormValues
  errors: AdminProjectFormErrors
  submitting: boolean
  slugManual: boolean
  mode: 'create' | 'edit'
  onChange: (next: AdminProjectFormValues) => void
  onSlugManualChange: (manual: boolean) => void
  onSubmitDraft: () => void
  onSubmitPublish: () => void
  onCancel: () => void
}

function AdminProjectForm({
  values,
  errors,
  submitting,
  slugManual,
  mode,
  onChange,
  onSlugManualChange,
  onSubmitDraft,
  onSubmitPublish,
  onCancel,
}: AdminProjectFormProps) {
  const baseId = useId()
  const [picker, setPicker] = useState<'cover' | 'gallery' | null>(null)

  const update = <K extends keyof AdminProjectFormValues>(
    key: K,
    value: AdminProjectFormValues[K],
  ) => {
    onChange({ ...values, [key]: value })
  }

  const galleryUrls = values.galleryText
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)

  const setGalleryUrls = (urls: string[]) => {
    update('galleryText', urls.join('\n'))
  }

  const removeGalleryUrl = (url: string) => {
    setGalleryUrls(galleryUrls.filter((item) => item !== url))
  }

  const handleTitleChange = (title: string) => {
    if (!slugManual) {
      onChange({
        ...values,
        title,
        slug: suggestSlugFromTitle(title),
      })
      return
    }
    update('title', title)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <form className="admin-project-form" onSubmit={handleSubmit} noValidate>
      <div className="admin-project-form__grid">
        <div className="admin-project-form__field admin-project-form__field--full">
          <label className="admin-project-form__label" htmlFor={`${baseId}-title`}>
            Title
          </label>
          <input
            id={`${baseId}-title`}
            className={`admin-project-form__input${errors.title ? ' is-invalid' : ''}`}
            value={values.title}
            disabled={submitting}
            required
            onChange={(event) => handleTitleChange(event.target.value)}
          />
          {errors.title ? (
            <p className="admin-project-form__error">{errors.title}</p>
          ) : null}
        </div>

        <div className="admin-project-form__field admin-project-form__field--full">
          <label className="admin-project-form__label" htmlFor={`${baseId}-slug`}>
            Slug
          </label>
          <input
            id={`${baseId}-slug`}
            className={`admin-project-form__input${errors.slug ? ' is-invalid' : ''}`}
            value={values.slug}
            disabled={submitting}
            required
            onChange={(event) => {
              onSlugManualChange(true)
              update('slug', event.target.value)
            }}
          />
          <p className="admin-project-form__hint">
            Used in public URLs as /work/your-slug. Auto-suggested from the
            title until you edit it.
          </p>
          {errors.slug ? (
            <p className="admin-project-form__error">{errors.slug}</p>
          ) : null}
        </div>

        <div className="admin-project-form__field admin-project-form__field--full">
          <label
            className="admin-project-form__label"
            htmlFor={`${baseId}-description`}
          >
            Description
          </label>
          <textarea
            id={`${baseId}-description`}
            className={`admin-project-form__textarea${
              errors.description ? ' is-invalid' : ''
            }`}
            rows={5}
            value={values.description}
            disabled={submitting}
            required
            onChange={(event) => update('description', event.target.value)}
          />
          {errors.description ? (
            <p className="admin-project-form__error">{errors.description}</p>
          ) : null}
        </div>

        <div className="admin-project-form__field">
          <label
            className="admin-project-form__label"
            htmlFor={`${baseId}-category`}
          >
            Category
          </label>
          <select
            id={`${baseId}-category`}
            className={`admin-project-form__select${
              errors.category ? ' is-invalid' : ''
            }`}
            value={values.category}
            disabled={submitting}
            onChange={(event) =>
              update('category', event.target.value as ProjectCategory)
            }
          >
            {PROJECT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category ? (
            <p className="admin-project-form__error">{errors.category}</p>
          ) : null}
        </div>

        <div className="admin-project-form__field">
          <label
            className="admin-project-form__label"
            htmlFor={`${baseId}-order`}
          >
            Display order
          </label>
          <input
            id={`${baseId}-order`}
            className={`admin-project-form__input${
              errors.displayOrder ? ' is-invalid' : ''
            }`}
            type="number"
            step={1}
            value={values.displayOrder}
            disabled={submitting}
            onChange={(event) =>
              update('displayOrder', Number.parseInt(event.target.value, 10) || 0)
            }
          />
          {errors.displayOrder ? (
            <p className="admin-project-form__error">{errors.displayOrder}</p>
          ) : null}
        </div>

        <div className="admin-project-form__field admin-project-form__field--full">
          <label
            className="admin-project-form__label"
            htmlFor={`${baseId}-tech`}
          >
            Technologies
          </label>
          <textarea
            id={`${baseId}-tech`}
            className="admin-project-form__textarea"
            rows={3}
            value={values.technologiesText}
            disabled={submitting}
            placeholder={'React\nTypeScript\nVite'}
            onChange={(event) => update('technologiesText', event.target.value)}
          />
          <p className="admin-project-form__hint">
            One technology per line, or comma-separated.
          </p>
        </div>

        <div className="admin-project-form__field admin-project-form__field--full">
          <label
            className="admin-project-form__label"
            htmlFor={`${baseId}-cover`}
          >
            Cover image URL / path
          </label>
          <div className="admin-project-form__media-row">
            <input
              id={`${baseId}-cover`}
              className={`admin-project-form__input${
                errors.coverImage ? ' is-invalid' : ''
              }`}
              value={values.coverImage}
              disabled={submitting}
              required
              placeholder="/images/projects/example-cover.svg"
              onChange={(event) => update('coverImage', event.target.value)}
            />
            <button
              type="button"
              className="admin-project-form__media-btn"
              disabled={submitting}
              onClick={() => setPicker('cover')}
            >
              Choose from library
            </button>
          </div>
          {values.coverImage.trim() ? (
            <div className="admin-project-form__preview">
              <img
                src={values.coverImage.trim()}
                alt=""
                className="admin-project-form__preview-image"
              />
            </div>
          ) : null}
          {errors.coverImage ? (
            <p className="admin-project-form__error">{errors.coverImage}</p>
          ) : null}
        </div>

        <div className="admin-project-form__field admin-project-form__field--full">
          <label
            className="admin-project-form__label"
            htmlFor={`${baseId}-gallery`}
          >
            Gallery image URLs / paths
          </label>
          <div className="admin-project-form__media-row">
            <textarea
              id={`${baseId}-gallery`}
              className={`admin-project-form__textarea${
                errors.galleryText ? ' is-invalid' : ''
              }`}
              rows={4}
              value={values.galleryText}
              disabled={submitting}
              placeholder={'/images/projects/example-1.svg\n/images/projects/example-2.svg'}
              onChange={(event) => update('galleryText', event.target.value)}
            />
            <button
              type="button"
              className="admin-project-form__media-btn"
              disabled={submitting}
              onClick={() => setPicker('gallery')}
            >
              Add from library
            </button>
          </div>
          <p className="admin-project-form__hint">
            One image reference per line, or pick from the media library.
          </p>
          {galleryUrls.length > 0 ? (
            <ul className="admin-project-form__gallery">
              {galleryUrls.map((url) => (
                <li key={url} className="admin-project-form__gallery-item">
                  <img
                    src={url}
                    alt=""
                    className="admin-project-form__gallery-thumb"
                  />
                  <button
                    type="button"
                    className="admin-project-form__gallery-remove"
                    disabled={submitting}
                    onClick={() => removeGalleryUrl(url)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {errors.galleryText ? (
            <p className="admin-project-form__error">{errors.galleryText}</p>
          ) : null}
        </div>

        <div className="admin-project-form__field">
          <label
            className="admin-project-form__label"
            htmlFor={`${baseId}-live`}
          >
            Live project URL
          </label>
          <input
            id={`${baseId}-live`}
            className={`admin-project-form__input${
              errors.liveUrl ? ' is-invalid' : ''
            }`}
            type="url"
            value={values.liveUrl}
            disabled={submitting}
            placeholder="https://"
            onChange={(event) => update('liveUrl', event.target.value)}
          />
          {errors.liveUrl ? (
            <p className="admin-project-form__error">{errors.liveUrl}</p>
          ) : null}
        </div>

        <div className="admin-project-form__field">
          <label
            className="admin-project-form__label"
            htmlFor={`${baseId}-github`}
          >
            GitHub URL
          </label>
          <input
            id={`${baseId}-github`}
            className={`admin-project-form__input${
              errors.githubUrl ? ' is-invalid' : ''
            }`}
            type="url"
            value={values.githubUrl}
            disabled={submitting}
            placeholder="https://"
            onChange={(event) => update('githubUrl', event.target.value)}
          />
          {errors.githubUrl ? (
            <p className="admin-project-form__error">{errors.githubUrl}</p>
          ) : null}
        </div>

        <div className="admin-project-form__field">
          <label
            className="admin-project-form__label"
            htmlFor={`${baseId}-status`}
          >
            Publication status
          </label>
          <select
            id={`${baseId}-status`}
            className="admin-project-form__select"
            value={values.status}
            disabled={submitting}
            onChange={(event) =>
              update('status', event.target.value as ContentStatus)
            }
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="admin-project-form__field admin-project-form__field--check">
          <label className="admin-project-form__check" htmlFor={`${baseId}-featured`}>
            <input
              id={`${baseId}-featured`}
              type="checkbox"
              checked={values.featured}
              disabled={submitting}
              onChange={(event) => update('featured', event.target.checked)}
            />
            <span>Featured project</span>
          </label>
        </div>
      </div>

      <div className="admin-project-form__actions">
        <button
          type="button"
          className="admin-project-form__button admin-project-form__button--ghost"
          disabled={submitting}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="admin-project-form__button admin-project-form__button--secondary"
          disabled={submitting}
          onClick={onSubmitDraft}
        >
          {submitting ? 'Saving…' : 'Save draft'}
        </button>
        <button
          type="button"
          className="admin-project-form__button admin-project-form__button--primary"
          disabled={submitting}
          onClick={onSubmitPublish}
        >
          {submitting
            ? 'Saving…'
            : mode === 'edit' && values.status === 'published'
              ? 'Save & keep published'
              : 'Publish'}
        </button>
      </div>

      {picker === 'cover' ? (
        <MediaPickerModal
          title="Choose cover image"
          mode="single"
          selectedUrls={values.coverImage.trim() ? [values.coverImage.trim()] : []}
          onClose={() => setPicker(null)}
          onConfirm={(urls) => {
            const next = urls[0]
            if (next) update('coverImage', next)
            setPicker(null)
          }}
        />
      ) : null}

      {picker === 'gallery' ? (
        <MediaPickerModal
          title="Add gallery images"
          mode="multiple"
          selectedUrls={galleryUrls}
          onClose={() => setPicker(null)}
          onConfirm={(urls) => {
            const merged = [...galleryUrls]
            for (const url of urls) {
              if (!merged.includes(url)) merged.push(url)
            }
            setGalleryUrls(merged)
            setPicker(null)
          }}
        />
      ) : null}
    </form>
  )
}

export default AdminProjectForm
