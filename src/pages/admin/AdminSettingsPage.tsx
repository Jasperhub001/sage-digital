import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  emptySiteSettingsFormValues,
  siteSettingsFormsAreEqual,
  siteSettingsToFormValues,
  validateSiteSettingsForm,
  type AdminSiteSettingsFormErrors,
  type AdminSiteSettingsFormValues,
} from '../../lib/admin/siteSettingsForm'
import { adminSiteSettingsService } from '../../services/adminSiteSettingsService'
import '../../components/admin/AdminProjectForm.css'
import './AdminProjectFormPage.css'
import './AdminSettingsPage.css'

function AdminSettingsPage() {
  const [values, setValues] = useState<AdminSiteSettingsFormValues>(
    emptySiteSettingsFormValues(),
  )
  const [initialValues, setInitialValues] = useState<AdminSiteSettingsFormValues>(
    emptySiteSettingsFormValues(),
  )
  const [errors, setErrors] = useState<AdminSiteSettingsFormErrors>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const dirty = useMemo(
    () => !siteSettingsFormsAreEqual(values, initialValues),
    [values, initialValues],
  )

  useEffect(() => {
    if (!dirty) return

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      setLoading(true)
      try {
        const settings = await adminSiteSettingsService.get()
        if (cancelled) return
        const next = siteSettingsToFormValues(settings)
        setValues(next)
        setInitialValues(next)
        setLoadError(null)
      } catch {
        if (cancelled) return
        setLoadError(
          'Unable to load website settings. Confirm the site_settings migration is applied and your administrator session is valid.',
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadSettings()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const update = <K extends keyof AdminSiteSettingsFormValues>(
    key: K,
    value: AdminSiteSettingsFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
    setSuccess(null)
    setFormError(null)
  }

  const handleReset = () => {
    if (dirty) {
      const confirmed = window.confirm(
        'Discard unsaved changes and restore the last saved settings?',
      )
      if (!confirmed) return
    }
    setValues(initialValues)
    setErrors({})
    setFormError(null)
    setSuccess(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return

    const nextErrors = validateSiteSettingsForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setFormError('Please correct the highlighted fields and try again.')
      setSuccess(null)
      return
    }

    setSaving(true)
    setFormError(null)
    setSuccess(null)

    try {
      const saved = await adminSiteSettingsService.save(values)
      const next = siteSettingsToFormValues(saved)
      setValues(next)
      setInitialValues(next)
      setSuccess('Website settings saved. Public pages will use the new values.')
    } catch (caught) {
      setFormError(
        caught instanceof Error
          ? caught.message
          : 'Unable to save website settings.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-project-editor admin-settings">
      <header className="admin-project-editor__header">
        <p className="admin-project-editor__eyebrow">Workspace</p>
        <h2 className="admin-project-editor__title">Website settings</h2>
        <p className="admin-project-editor__lede">
          Manage public business details, hero copy, footer text and contact
          channels. Empty optional fields stay hidden on the site. Saved values
          are what visitors see after refresh.
        </p>
      </header>

      {loading ? (
        <p className="admin-project-editor__status">Loading settings…</p>
      ) : null}

      {loadError ? (
        <div className="admin-project-editor__alert" role="alert">
          <p>{loadError}</p>
          <button
            type="button"
            className="admin-settings__retry"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !loadError ? (
        <form className="admin-project-form" onSubmit={handleSubmit} noValidate>
          {formError ? (
            <p className="admin-project-editor__alert" role="alert">
              {formError}
            </p>
          ) : null}
          {success ? (
            <p className="admin-project-editor__success" role="status">
              {success}
            </p>
          ) : null}
          {dirty ? (
            <p className="admin-settings__dirty" role="status">
              You have unsaved changes.
            </p>
          ) : (
            <p className="admin-settings__saved" role="status">
              Showing saved values.
            </p>
          )}

          <section className="admin-settings__section" aria-labelledby="settings-business">
            <h3 id="settings-business" className="admin-settings__section-title">
              Business information
            </h3>
            <div className="admin-project-form__grid">
              <div className="admin-project-form__field">
                <label className="admin-project-form__label" htmlFor="settings-brand">
                  Brand name
                </label>
                <input
                  id="settings-brand"
                  className={`admin-project-form__input${errors.brandName ? ' is-invalid' : ''}`}
                  value={values.brandName}
                  maxLength={80}
                  onChange={(event) => update('brandName', event.target.value)}
                  disabled={saving}
                />
                {errors.brandName ? (
                  <p className="admin-project-form__error">{errors.brandName}</p>
                ) : null}
              </div>

              <div className="admin-project-form__field">
                <label className="admin-project-form__label" htmlFor="settings-email">
                  Contact email
                </label>
                <input
                  id="settings-email"
                  type="email"
                  className={`admin-project-form__input${errors.contactEmail ? ' is-invalid' : ''}`}
                  value={values.contactEmail}
                  maxLength={254}
                  onChange={(event) => update('contactEmail', event.target.value)}
                  disabled={saving}
                />
                {errors.contactEmail ? (
                  <p className="admin-project-form__error">{errors.contactEmail}</p>
                ) : null}
              </div>

              <div className="admin-project-form__field">
                <label className="admin-project-form__label" htmlFor="settings-whatsapp">
                  WhatsApp number
                </label>
                <input
                  id="settings-whatsapp"
                  className={`admin-project-form__input${errors.whatsappNumber ? ' is-invalid' : ''}`}
                  value={values.whatsappNumber}
                  maxLength={20}
                  placeholder="2347070296633"
                  onChange={(event) => update('whatsappNumber', event.target.value)}
                  disabled={saving}
                />
                {errors.whatsappNumber ? (
                  <p className="admin-project-form__error">{errors.whatsappNumber}</p>
                ) : (
                  <p className="admin-project-form__hint">
                    International digits only, no + or spaces.
                  </p>
                )}
              </div>

              <div className="admin-project-form__field">
                <label className="admin-project-form__label" htmlFor="settings-location">
                  Location (optional)
                </label>
                <input
                  id="settings-location"
                  className={`admin-project-form__input${errors.location ? ' is-invalid' : ''}`}
                  value={values.location}
                  maxLength={120}
                  onChange={(event) => update('location', event.target.value)}
                  disabled={saving}
                />
                {errors.location ? (
                  <p className="admin-project-form__error">{errors.location}</p>
                ) : null}
              </div>

              <div className="admin-project-form__field admin-project-form__field--full">
                <label
                  className="admin-project-form__label"
                  htmlFor="settings-business-description"
                >
                  Short business description
                </label>
                <textarea
                  id="settings-business-description"
                  className={`admin-project-form__textarea${errors.businessDescription ? ' is-invalid' : ''}`}
                  rows={4}
                  maxLength={2000}
                  value={values.businessDescription}
                  onChange={(event) =>
                    update('businessDescription', event.target.value)
                  }
                  disabled={saving}
                />
                {errors.businessDescription ? (
                  <p className="admin-project-form__error">
                    {errors.businessDescription}
                  </p>
                ) : (
                  <p className="admin-project-form__hint">
                    Shown in the About section.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="admin-settings__section" aria-labelledby="settings-social">
            <h3 id="settings-social" className="admin-settings__section-title">
              Social links
            </h3>
            <div className="admin-project-form__grid">
              <div className="admin-project-form__field">
                <label className="admin-project-form__label" htmlFor="settings-github">
                  GitHub
                </label>
                <input
                  id="settings-github"
                  className={`admin-project-form__input${errors.githubUrl ? ' is-invalid' : ''}`}
                  value={values.githubUrl}
                  placeholder="https://"
                  onChange={(event) => update('githubUrl', event.target.value)}
                  disabled={saving}
                />
                {errors.githubUrl ? (
                  <p className="admin-project-form__error">{errors.githubUrl}</p>
                ) : null}
              </div>
              <div className="admin-project-form__field">
                <label className="admin-project-form__label" htmlFor="settings-linkedin">
                  LinkedIn
                </label>
                <input
                  id="settings-linkedin"
                  className={`admin-project-form__input${errors.linkedinUrl ? ' is-invalid' : ''}`}
                  value={values.linkedinUrl}
                  placeholder="https://"
                  onChange={(event) => update('linkedinUrl', event.target.value)}
                  disabled={saving}
                />
                {errors.linkedinUrl ? (
                  <p className="admin-project-form__error">{errors.linkedinUrl}</p>
                ) : null}
              </div>
              <div className="admin-project-form__field">
                <label className="admin-project-form__label" htmlFor="settings-instagram">
                  Instagram
                </label>
                <input
                  id="settings-instagram"
                  className={`admin-project-form__input${errors.instagramUrl ? ' is-invalid' : ''}`}
                  value={values.instagramUrl}
                  placeholder="https://"
                  onChange={(event) => update('instagramUrl', event.target.value)}
                  disabled={saving}
                />
                {errors.instagramUrl ? (
                  <p className="admin-project-form__error">{errors.instagramUrl}</p>
                ) : null}
              </div>
              <div className="admin-project-form__field">
                <label className="admin-project-form__label" htmlFor="settings-other-label">
                  Other label
                </label>
                <input
                  id="settings-other-label"
                  className={`admin-project-form__input${errors.otherSocialLabel ? ' is-invalid' : ''}`}
                  value={values.otherSocialLabel}
                  placeholder="X / Behance / …"
                  maxLength={40}
                  onChange={(event) =>
                    update('otherSocialLabel', event.target.value)
                  }
                  disabled={saving}
                />
                {errors.otherSocialLabel ? (
                  <p className="admin-project-form__error">
                    {errors.otherSocialLabel}
                  </p>
                ) : null}
              </div>
              <div className="admin-project-form__field admin-project-form__field--full">
                <label className="admin-project-form__label" htmlFor="settings-other-url">
                  Other URL
                </label>
                <input
                  id="settings-other-url"
                  className={`admin-project-form__input${errors.otherSocialUrl ? ' is-invalid' : ''}`}
                  value={values.otherSocialUrl}
                  placeholder="https://"
                  onChange={(event) => update('otherSocialUrl', event.target.value)}
                  disabled={saving}
                />
                {errors.otherSocialUrl ? (
                  <p className="admin-project-form__error">{errors.otherSocialUrl}</p>
                ) : null}
              </div>
            </div>
          </section>

          <section
            className="admin-settings__section"
            aria-labelledby="settings-presentation"
          >
            <h3 id="settings-presentation" className="admin-settings__section-title">
              Website presentation
            </h3>
            <div className="admin-project-form__grid">
              <div className="admin-project-form__field admin-project-form__field--full">
                <label className="admin-project-form__label" htmlFor="settings-hero-heading">
                  Hero heading
                </label>
                <input
                  id="settings-hero-heading"
                  className={`admin-project-form__input${errors.heroHeading ? ' is-invalid' : ''}`}
                  value={values.heroHeading}
                  maxLength={200}
                  onChange={(event) => update('heroHeading', event.target.value)}
                  disabled={saving}
                />
                {errors.heroHeading ? (
                  <p className="admin-project-form__error">{errors.heroHeading}</p>
                ) : null}
              </div>
              <div className="admin-project-form__field admin-project-form__field--full">
                <label
                  className="admin-project-form__label"
                  htmlFor="settings-hero-support"
                >
                  Hero supporting text
                </label>
                <textarea
                  id="settings-hero-support"
                  className={`admin-project-form__textarea${errors.heroSupportingText ? ' is-invalid' : ''}`}
                  rows={3}
                  maxLength={600}
                  value={values.heroSupportingText}
                  onChange={(event) =>
                    update('heroSupportingText', event.target.value)
                  }
                  disabled={saving}
                />
                {errors.heroSupportingText ? (
                  <p className="admin-project-form__error">
                    {errors.heroSupportingText}
                  </p>
                ) : null}
              </div>
              <div className="admin-project-form__field admin-project-form__field--full">
                <label className="admin-project-form__label" htmlFor="settings-footer">
                  Footer description
                </label>
                <textarea
                  id="settings-footer"
                  className={`admin-project-form__textarea${errors.footerDescription ? ' is-invalid' : ''}`}
                  rows={3}
                  maxLength={400}
                  value={values.footerDescription}
                  onChange={(event) =>
                    update('footerDescription', event.target.value)
                  }
                  disabled={saving}
                />
                {errors.footerDescription ? (
                  <p className="admin-project-form__error">
                    {errors.footerDescription}
                  </p>
                ) : null}
              </div>
              <div className="admin-project-form__field admin-project-form__field--full">
                <label className="admin-project-form__label" htmlFor="settings-copyright">
                  Copyright text
                </label>
                <input
                  id="settings-copyright"
                  className={`admin-project-form__input${errors.copyrightText ? ' is-invalid' : ''}`}
                  value={values.copyrightText}
                  maxLength={160}
                  onChange={(event) => update('copyrightText', event.target.value)}
                  disabled={saving}
                />
                {errors.copyrightText ? (
                  <p className="admin-project-form__error">{errors.copyrightText}</p>
                ) : (
                  <p className="admin-project-form__hint">
                    Use {'{year}'} for the current year and {'{brand}'} for the
                    brand name.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="admin-settings__section" aria-labelledby="settings-contact">
            <h3 id="settings-contact" className="admin-settings__section-title">
              Contact preferences
            </h3>
            <div className="admin-settings__checks">
              <label className="admin-settings__check">
                <input
                  type="checkbox"
                  checked={values.showContactEmail}
                  onChange={(event) =>
                    update('showContactEmail', event.target.checked)
                  }
                  disabled={saving}
                />
                <span>Show contact email on the public site</span>
              </label>
              <label className="admin-settings__check">
                <input
                  type="checkbox"
                  checked={values.showWhatsapp}
                  onChange={(event) => update('showWhatsapp', event.target.checked)}
                  disabled={saving}
                />
                <span>Show WhatsApp on the public site</span>
              </label>
            </div>
          </section>

          <div className="admin-project-form__actions">
            <button
              type="submit"
              className="admin-project-form__button admin-project-form__button--primary"
              disabled={saving || !dirty}
            >
              {saving ? 'Saving…' : 'Save settings'}
            </button>
            <button
              type="button"
              className="admin-project-form__button admin-project-form__button--ghost"
              onClick={handleReset}
              disabled={saving || !dirty}
            >
              Discard changes
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )
}

export default AdminSettingsPage
