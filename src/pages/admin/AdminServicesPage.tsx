import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AdminServiceRecord } from '../../lib/content/contracts'
import { adminServiceService } from '../../services/adminServiceService'
import './AdminProjectsPage.css'

type Feedback =
  | { tone: 'success' | 'error'; message: string }
  | null

function AdminServicesPage() {
  const [services, setServices] = useState<AdminServiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadServices() {
      try {
        const rows = await adminServiceService.listAll()
        if (cancelled) return
        setServices(rows)
        setError(null)
      } catch {
        if (cancelled) return
        setError(
          'Unable to load services. Confirm Supabase is configured and your administrator session is valid.',
        )
        setServices([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadServices()
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
            : 'The service update failed.',
      })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = (service: AdminServiceRecord) => {
    const confirmed = window.confirm(
      `Delete “${service.title}”? This cannot be undone.`,
    )
    if (!confirmed) return

    void withBusy(service.id, async () => {
      await adminServiceService.remove(service.id)
      setServices((current) => current.filter((row) => row.id !== service.id))
      setFeedback({ tone: 'success', message: 'Service deleted.' })
    })
  }

  const handleToggleStatus = (service: AdminServiceRecord) => {
    const next = service.status === 'published' ? 'draft' : 'published'
    void withBusy(service.id, async () => {
      const updated = await adminServiceService.setStatus(service.id, next)
      setServices((current) =>
        current.map((row) => (row.id === updated.id ? updated : row)),
      )
      setFeedback({
        tone: 'success',
        message:
          next === 'published'
            ? 'Service published.'
            : 'Service unpublished (saved as draft).',
      })
    })
  }

  const handleMove = (service: AdminServiceRecord, direction: 'up' | 'down') => {
    void withBusy(service.id, async () => {
      const next = await adminServiceService.move(service.id, direction)
      setServices(next)
      setFeedback({ tone: 'success', message: 'Display order updated.' })
    })
  }

  return (
    <div className="admin-projects">
      <header className="admin-projects__header">
        <div>
          <p className="admin-projects__eyebrow">Offerings</p>
          <h2 className="admin-projects__title">Services</h2>
          <p className="admin-projects__lede">
            Create, edit, publish and order studio services. Drafts stay
            private; only published services appear on the public site.
          </p>
        </div>
        <Link to="/admin/services/new" className="admin-projects__add">
          Add service
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
          Loading services…
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

      {!loading && !error && services.length === 0 ? (
        <div className="admin-projects__empty">
          <h3 className="admin-projects__empty-title">No services yet</h3>
          <p className="admin-projects__empty-copy">
            Add your first service offering to manage drafts, publishing and
            display order from this dashboard.
          </p>
          <Link to="/admin/services/new" className="admin-projects__add">
            Add service
          </Link>
        </div>
      ) : null}

      {!loading && !error && services.length > 0 ? (
        <div className="admin-projects__table-wrap">
          <table className="admin-projects__table">
            <thead>
              <tr>
                <th scope="col">Service</th>
                <th scope="col">Status</th>
                <th scope="col">Features</th>
                <th scope="col">Order</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {services.map((service, index) => {
                const busy = busyId === service.id
                return (
                  <tr key={service.id}>
                    <td data-label="Service">
                      <p className="admin-projects__name">{service.title}</p>
                      <p className="admin-projects__slug">/{service.slug}</p>
                    </td>
                    <td data-label="Status">
                      <span
                        className={`admin-projects__pill admin-projects__pill--${service.status}`}
                      >
                        {service.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td data-label="Features">{service.features.length}</td>
                    <td data-label="Order">
                      <div className="admin-projects__order">
                        <span>{service.displayOrder}</span>
                        <div className="admin-projects__order-actions">
                          <button
                            type="button"
                            className="admin-projects__icon-btn"
                            disabled={busy || index === 0}
                            aria-label={`Move ${service.title} up`}
                            onClick={() => handleMove(service, 'up')}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="admin-projects__icon-btn"
                            disabled={busy || index === services.length - 1}
                            aria-label={`Move ${service.title} down`}
                            onClick={() => handleMove(service, 'down')}
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    </td>
                    <td data-label="Actions">
                      <div className="admin-projects__actions">
                        <Link
                          to={`/admin/services/${service.id}/edit`}
                          className="admin-projects__action"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="admin-projects__action"
                          disabled={busy}
                          onClick={() => handleToggleStatus(service)}
                        >
                          {service.status === 'published'
                            ? 'Unpublish'
                            : 'Publish'}
                        </button>
                        <button
                          type="button"
                          className="admin-projects__action admin-projects__action--danger"
                          disabled={busy}
                          onClick={() => handleDelete(service)}
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

export default AdminServicesPage
