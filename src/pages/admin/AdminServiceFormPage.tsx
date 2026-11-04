import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminServiceForm from '../../components/admin/AdminServiceForm'
import {
  emptyServiceFormValues,
  serviceFormsAreEqual,
  serviceToFormValues,
  validateServiceForm,
  type AdminServiceFormErrors,
  type AdminServiceFormValues,
} from '../../lib/admin/serviceForm'
import type { ContentStatus } from '../../types/content'
import { adminServiceService } from '../../services/adminServiceService'
import './AdminProjectFormPage.css'

interface AdminServiceFormPageProps {
  mode: 'create' | 'edit'
}

function AdminServiceFormPage({ mode }: AdminServiceFormPageProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [values, setValues] = useState<AdminServiceFormValues>(
    emptyServiceFormValues(),
  )
  const [initialValues, setInitialValues] = useState<AdminServiceFormValues>(
    emptyServiceFormValues(),
  )
  const [errors, setErrors] = useState<AdminServiceFormErrors>({})
  const [slugManual, setSlugManual] = useState(false)
  const [loading, setLoading] = useState(mode === 'edit' && Boolean(id))
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(
    mode === 'edit' && !id ? 'That service could not be found.' : null,
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const dirty = useMemo(
    () => !serviceFormsAreEqual(values, initialValues),
    [values, initialValues],
  )

  // Do not use useBlocker with BrowserRouter — it crashes create/edit pages.
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
    if (mode !== 'edit' || !id) return

    let cancelled = false

    async function loadService() {
      try {
        const service = await adminServiceService.getById(id)
        if (cancelled) return
        if (!service) {
          setLoadError('That service could not be found.')
          return
        }
        const next = serviceToFormValues(service)
        setValues(next)
        setInitialValues(next)
        setSlugManual(true)
        setLoadError(null)
      } catch {
        if (!cancelled) {
          setLoadError('Unable to load this service for editing.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadService()
    return () => {
      cancelled = true
    }
  }, [mode, id])

  const save = async (status: ContentStatus) => {
    if (submitting) return

    const nextValues = { ...values, status }
    const nextErrors = validateServiceForm(nextValues)
    setErrors(nextErrors)
    setFormError(null)
    setSuccess(null)

    if (Object.keys(nextErrors).length > 0) {
      setFormError('Please fix the highlighted fields before saving.')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'create') {
        const created = await adminServiceService.create(nextValues)
        setInitialValues(nextValues)
        setValues(nextValues)
        setSuccess(
          status === 'published'
            ? 'Service created and published.'
            : 'Draft service created.',
        )
        navigate(`/admin/services/${created.id}/edit`, { replace: true })
        return
      }

      if (!id) {
        setFormError('Missing service id.')
        return
      }

      const updated = await adminServiceService.update(id, nextValues)
      const mapped = serviceToFormValues(updated)
      setValues(mapped)
      setInitialValues(mapped)
      setSuccess(
        status === 'published'
          ? 'Service saved and published.'
          : 'Draft saved.',
      )
    } catch (caught) {
      setFormError(
        caught instanceof Error
          ? caught.message
          : 'Unable to save the service.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (dirty) {
      const leave = window.confirm(
        'You have unsaved changes. Discard them and return to the service list?',
      )
      if (!leave) return
    }
    navigate('/admin/services')
  }

  return (
    <div className="admin-project-editor">
      <header className="admin-project-editor__header">
        <p className="admin-project-editor__eyebrow">
          <Link to="/admin/services" className="admin-project-editor__back">
            Services
          </Link>
          <span aria-hidden="true"> / </span>
          {mode === 'create' ? 'New' : 'Edit'}
        </p>
        <h2 className="admin-project-editor__title">
          {mode === 'create' ? 'Add service' : 'Edit service'}
        </h2>
        <p className="admin-project-editor__lede">
          Save as draft to keep work private, or publish when the service should
          appear on the public website.
        </p>
      </header>

      {loading ? (
        <p className="admin-project-editor__status" role="status">
          Loading service…
        </p>
      ) : null}

      {!loading && loadError ? (
        <div className="admin-project-editor__alert" role="alert">
          <p>{loadError}</p>
          <Link to="/admin/services" className="admin-project-editor__link">
            Back to services
          </Link>
        </div>
      ) : null}

      {!loading && !loadError ? (
        <>
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
          <AdminServiceForm
            mode={mode}
            values={values}
            errors={errors}
            submitting={submitting}
            slugManual={slugManual}
            onChange={setValues}
            onSlugManualChange={setSlugManual}
            onSubmitDraft={() => {
              void save('draft')
            }}
            onSubmitPublish={() => {
              void save('published')
            }}
            onCancel={handleCancel}
          />
        </>
      ) : null}
    </div>
  )
}

export default AdminServiceFormPage
