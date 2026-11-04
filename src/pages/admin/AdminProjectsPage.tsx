import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AdminProjectRecord } from '../../lib/content/contracts'
import { adminProjectService } from '../../services/adminProjectService'
import './AdminProjectsPage.css'

type Feedback =
  | { tone: 'success' | 'error'; message: string }
  | null

function AdminProjectsPage() {
  const [projects, setProjects] = useState<AdminProjectRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadProjects() {
      try {
        const rows = await adminProjectService.listAll()
        if (cancelled) return
        setProjects(rows)
        setError(null)
      } catch {
        if (cancelled) return
        setError(
          'Unable to load projects. Confirm Supabase is configured and your administrator session is valid.',
        )
        setProjects([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadProjects()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const withBusy = async (id: string, action: () => Promise<void>) => {
    if (busyId) return
    setBusyId(id)
    setFeedback(null)
    try {
      await action()
    } catch (caught) {
      setFeedback({
        tone: 'error',
        message:
          caught instanceof Error
            ? caught.message
            : 'The project update failed.',
      })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = (project: AdminProjectRecord) => {
    const confirmed = window.confirm(
      `Delete “${project.title}”? This cannot be undone.`,
    )
    if (!confirmed) return

    void withBusy(project.id, async () => {
      await adminProjectService.remove(project.id)
      setProjects((current) => current.filter((row) => row.id !== project.id))
      setFeedback({ tone: 'success', message: 'Project deleted.' })
    })
  }

  const handleToggleStatus = (project: AdminProjectRecord) => {
    const next = project.status === 'published' ? 'draft' : 'published'
    void withBusy(project.id, async () => {
      const updated = await adminProjectService.setStatus(project.id, next)
      setProjects((current) =>
        current.map((row) => (row.id === updated.id ? updated : row)),
      )
      setFeedback({
        tone: 'success',
        message:
          next === 'published'
            ? 'Project published.'
            : 'Project unpublished (saved as draft).',
      })
    })
  }

  const handleToggleFeatured = (project: AdminProjectRecord) => {
    void withBusy(project.id, async () => {
      const updated = await adminProjectService.setFeatured(
        project.id,
        !project.featured,
      )
      setProjects((current) =>
        current.map((row) => (row.id === updated.id ? updated : row)),
      )
      setFeedback({
        tone: 'success',
        message: updated.featured
          ? 'Project marked as featured.'
          : 'Featured flag removed.',
      })
    })
  }

  const handleMove = (project: AdminProjectRecord, direction: 'up' | 'down') => {
    void withBusy(project.id, async () => {
      const next = await adminProjectService.move(project.id, direction)
      setProjects(next)
      setFeedback({ tone: 'success', message: 'Display order updated.' })
    })
  }

  return (
    <div className="admin-projects">
      <header className="admin-projects__header">
        <div>
          <p className="admin-projects__eyebrow">Portfolio</p>
          <h2 className="admin-projects__title">Projects</h2>
          <p className="admin-projects__lede">
            Create, edit, publish and order portfolio projects. Drafts stay
            private; only published projects appear on the public site.
          </p>
        </div>
        <Link to="/admin/projects/new" className="admin-projects__add">
          Add project
        </Link>
      </header>

      {feedback ? (
        <p
          className={`admin-projects__feedback admin-projects__feedback--${feedback.tone}`}
          role="status"
        >
          {feedback.message}
        </p>
      ) : null}

      {loading ? (
        <p className="admin-projects__status" role="status">
          Loading projects…
        </p>
      ) : null}

      {!loading && error ? (
        <div className="admin-projects__alert" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="admin-projects__retry"
            onClick={() => {
              setLoading(true)
              setReloadKey((key) => key + 1)
            }}
          >
            Try again
          </button>
        </div>
      ) : null}

      {!loading && !error && projects.length === 0 ? (
        <div className="admin-projects__empty">
          <h3 className="admin-projects__empty-title">No projects yet</h3>
          <p className="admin-projects__empty-copy">
            Add your first portfolio project to manage drafts, publishing and
            featured order from this dashboard.
          </p>
          <Link to="/admin/projects/new" className="admin-projects__add">
            Add project
          </Link>
        </div>
      ) : null}

      {!loading && !error && projects.length > 0 ? (
        <div className="admin-projects__table-wrap">
          <table className="admin-projects__table">
            <thead>
              <tr>
                <th scope="col">Project</th>
                <th scope="col">Category</th>
                <th scope="col">Status</th>
                <th scope="col">Featured</th>
                <th scope="col">Order</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => {
                const busy = busyId === project.id
                return (
                  <tr key={project.id}>
                    <td data-label="Project">
                      <p className="admin-projects__name">{project.title}</p>
                      <p className="admin-projects__slug">/{project.slug}</p>
                    </td>
                    <td data-label="Category">{project.category}</td>
                    <td data-label="Status">
                      <span
                        className={`admin-projects__pill admin-projects__pill--${project.status}`}
                      >
                        {project.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td data-label="Featured">
                      {project.featured ? 'Yes' : 'No'}
                    </td>
                    <td data-label="Order">
                      <div className="admin-projects__order">
                        <span>{project.displayOrder}</span>
                        <div className="admin-projects__order-actions">
                          <button
                            type="button"
                            className="admin-projects__icon-btn"
                            disabled={busy || index === 0}
                            aria-label={`Move ${project.title} up`}
                            onClick={() => handleMove(project, 'up')}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="admin-projects__icon-btn"
                            disabled={busy || index === projects.length - 1}
                            aria-label={`Move ${project.title} down`}
                            onClick={() => handleMove(project, 'down')}
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    </td>
                    <td data-label="Actions">
                      <div className="admin-projects__actions">
                        <Link
                          to={`/admin/projects/${project.id}/edit`}
                          className="admin-projects__action"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="admin-projects__action"
                          disabled={busy}
                          onClick={() => handleToggleStatus(project)}
                        >
                          {project.status === 'published'
                            ? 'Unpublish'
                            : 'Publish'}
                        </button>
                        <button
                          type="button"
                          className="admin-projects__action"
                          disabled={busy}
                          onClick={() => handleToggleFeatured(project)}
                        >
                          {project.featured ? 'Unfeature' : 'Feature'}
                        </button>
                        <button
                          type="button"
                          className="admin-projects__action admin-projects__action--danger"
                          disabled={busy}
                          onClick={() => handleDelete(project)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}

export default AdminProjectsPage
