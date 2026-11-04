import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminProjectForm from '../../components/admin/AdminProjectForm'
import {
  emptyProjectFormValues,
  formsAreEqual,
  projectToFormValues,
  validateProjectForm,
  type AdminProjectFormErrors,
  type AdminProjectFormValues,
} from '../../lib/admin/projectForm'
import type { ContentStatus } from '../../types/content'
import { adminProjectService } from '../../services/adminProjectService'
import './AdminProjectFormPage.css'

interface AdminProjectFormPageProps {
  mode: 'create' | 'edit'
}

function AdminProjectFormPage({ mode }: AdminProjectFormPageProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [values, setValues] = useState<AdminProjectFormValues>(
    emptyProjectFormValues(),
  )
  const [initialValues, setInitialValues] = useState<AdminProjectFormValues>(
    emptyProjectFormValues(),
  )
  const [errors, setErrors] = useState<AdminProjectFormErrors>({})
  const [slugManual, setSlugManual] = useState(false)
  const [loading, setLoading] = useState(mode === 'edit' && Boolean(id))
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(
    mode === 'edit' && !id ? 'That project could not be found.' : null,
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const dirty = useMemo(
    () => !formsAreEqual(values, initialValues),
    [values, initialValues],
  )

  // Note: do not use react-router `useBlocker` here — it requires a data
  // router (createBrowserRouter). This app uses BrowserRouter, and useBlocker
  // throws at render time, which produced blank create/edit pages.
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

    async function loadProject() {
      try {
        const project = await adminProjectService.getById(id)
        if (cancelled) return
        if (!project) {
          setLoadError('That project could not be found.')
          return
        }
        const next = projectToFormValues(project)
        setValues(next)
        setInitialValues(next)
        setSlugManual(true)
        setLoadError(null)
      } catch {
        if (!cancelled) {
          setLoadError('Unable to load this project for editing.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadProject()
    return () => {
      cancelled = true
    }
  }, [mode, id])

  const save = async (status: ContentStatus) => {
    if (submitting) return

    const nextValues = { ...values, status }
    const nextErrors = validateProjectForm(nextValues)
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
        const created = await adminProjectService.create(nextValues)
        setInitialValues(nextValues)
        setValues(nextValues)
        setSuccess(
          status === 'published'
            ? 'Project created and published.'
            : 'Draft project created.',
        )
        navigate(`/admin/projects/${created.id}/edit`, { replace: true })
        return
      }

      if (!id) {
        setFormError('Missing project id.')
        return
      }

      const updated = await adminProjectService.update(id, nextValues)
      const mapped = projectToFormValues(updated)
      setValues(mapped)
      setInitialValues(mapped)
      setSuccess(
        status === 'published'
          ? 'Project saved and published.'
          : 'Draft saved.',
      )
    } catch (caught) {
      setFormError(
        caught instanceof Error
          ? caught.message
          : 'Unable to save the project.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (dirty) {
      const leave = window.confirm(
        'You have unsaved changes. Discard them and return to the project list?',
      )
      if (!leave) return
    }
    navigate('/admin/projects')
  }

  return (
    <div className="admin-project-editor">
      <header className="admin-project-editor__header">
        <p className="admin-project-editor__eyebrow">
          <Link to="/admin/projects" className="admin-project-editor__back">
            Projects
          </Link>
          <span aria-hidden="true"> / </span>
          {mode === 'create' ? 'New' : 'Edit'}
        </p>
        <h2 className="admin-project-editor__title">
          {mode === 'create' ? 'Add project' : 'Edit project'}
        </h2>
        <p className="admin-project-editor__lede">
          Save as draft to keep work private, or publish when the project should
          appear on the public website.
        </p>
      </header>

      {loading ? (
        <p className="admin-project-editor__status" role="status">
          Loading project…
        </p>
      ) : null}

      {!loading && loadError ? (
        <div className="admin-project-editor__alert" role="alert">
          <p>{loadError}</p>
          <Link to="/admin/projects" className="admin-project-editor__link">
            Back to projects
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
          <AdminProjectForm
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

export default AdminProjectFormPage
