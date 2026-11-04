import { useId, type FormEvent } from 'react'
import type { ContentStatus } from '../../types/content'
import {
  suggestSlugFromTitle,
  type AdminServiceFormErrors,
  type AdminServiceFormValues,
} from '../../lib/admin/serviceForm'
import './AdminProjectForm.css'
import './AdminServiceForm.css'

interface AdminServiceFormProps {
  values: AdminServiceFormValues
  errors: AdminServiceFormErrors
  submitting: boolean
  slugManual: boolean
  mode: 'create' | 'edit'
  onChange: (next: AdminServiceFormValues) => void
  onSlugManualChange: (manual: boolean) => void
  onSubmitDraft: () => void
  onSubmitPublish: () => void
  onCancel: () => void
}

function AdminServiceForm({
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
}: AdminServiceFormProps) {
  const baseId = useId()

  const update = <K extends keyof AdminServiceFormValues>(
    key: K,
    value: AdminServiceFormValues[K],
  ) => {
    onChange({ ...values, [key]: value })
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

  const setFeatureAt = (index: number, value: string) => {
    const features = [...values.features]
    features[index] = value
    update('features', features)
  }

  const addFeature = () => {
    update('features', [...values.features, ''])
  }

  const removeFeature = (index: number) => {
    if (values.features.length <= 1) {
      update('features', [''])
      return
    }
    update(
      'features',
      values.features.filter((_, featureIndex) => featureIndex !== index),
    )
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
            Stable identifier for this service. Auto-suggested from the title
            until you edit it.
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
          <label className="admin-project-form__label" htmlFor={`${baseId}-icon`}>
            Icon URL / path
          </label>
          <input
            id={`${baseId}-icon`}
            className={`admin-project-form__input${
              errors.iconUrl ? ' is-invalid' : ''
            }`}
            value={values.iconUrl}
            disabled={submitting}
            placeholder="/icons/example.svg"
            onChange={(event) => update('iconUrl', event.target.value)}
          />
          <p className="admin-project-form__hint">Optional.</p>
          {errors.iconUrl ? (
            <p className="admin-project-form__error">{errors.iconUrl}</p>
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
          <p className="admin-project-form__label" id={`${baseId}-features-label`}>
            Features
          </p>
          <ul
            className="admin-service-form__features"
            aria-labelledby={`${baseId}-features-label`}
          >
            {values.features.map((feature, index) => {
              const featureId = `${baseId}-feature-${index}`
              return (
                <li key={featureId} className="admin-service-form__feature-row">
                  <label className="sr-only" htmlFor={featureId}>
                    Feature {index + 1}
                  </label>
                  <input
                    id={featureId}
                    className="admin-project-form__input"
                    value={feature}
                    disabled={submitting}
                    placeholder="Short capability or benefit"
                    onChange={(event) => setFeatureAt(index, event.target.value)}
                  />
                  <button
                    type="button"
                    className="admin-service-form__feature-remove"
                    disabled={submitting}
                    onClick={() => removeFeature(index)}
                  >
                    Remove
                  </button>
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            className="admin-service-form__feature-add"
            disabled={submitting}
            onClick={addFeature}
          >
            Add feature
          </button>
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
    </form>
  )
}

export default AdminServiceForm
