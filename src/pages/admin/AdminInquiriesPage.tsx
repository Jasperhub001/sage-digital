import { useEffect, useMemo, useState } from 'react'
import type { InquiryStatusFilter } from '../../lib/inquiries/contracts'
import { adminInquiryService } from '../../services/adminInquiryService'
import type { Inquiry, InquiryStatus } from '../../types/inquiry'
import './AdminProjectsPage.css'
import './AdminInquiriesPage.css'

type Feedback =
  | { tone: 'success' | 'error'; message: string }
  | null

const FILTERS: Array<{ value: InquiryStatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
  { value: 'archived', label: 'Archived' },
]

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function statusLabel(status: InquiryStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [filter, setFilter] = useState<InquiryStatusFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadInquiries() {
      setLoading(true)
      try {
        const rows = await adminInquiryService.listAll(filter)
        if (cancelled) return
        setInquiries(rows)
        setError(null)
        setSelectedId((current) => {
          if (current && rows.some((row) => row.id === current)) return current
          return rows[0]?.id ?? null
        })
      } catch {
        if (cancelled) return
        setError(
          'Unable to load inquiries. Confirm the inquiries migration is applied and your administrator session is valid.',
        )
        setInquiries([])
        setSelectedId(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadInquiries()
    return () => {
      cancelled = true
    }
  }, [filter, reloadKey])

  const selected = useMemo(
    () => inquiries.find((row) => row.id === selectedId) ?? null,
    [inquiries, selectedId],
  )

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
            : 'The inquiry update failed.',
      })
    } finally {
      setBusyId(null)
    }
  }

  const replaceInquiry = (updated: Inquiry) => {
    setInquiries((current) => {
      if (filter !== 'all' && updated.status !== filter) {
        return current.filter((row) => row.id !== updated.id)
      }
      return current.map((row) => (row.id === updated.id ? updated : row))
    })
  }

  const openInquiry = (inquiry: Inquiry) => {
    setSelectedId(inquiry.id)
    if (inquiry.status === 'new') {
      void withBusy(inquiry.id, async () => {
        const updated = await adminInquiryService.markRead(inquiry.id)
        replaceInquiry(updated)
      })
    }
  }

  const handleStatus = (inquiry: Inquiry, status: InquiryStatus) => {
    void withBusy(inquiry.id, async () => {
      const updated = await adminInquiryService.setStatus(inquiry.id, status)
      replaceInquiry(updated)
      setFeedback({
        tone: 'success',
        message: `Marked as ${statusLabel(status).toLowerCase()}.`,
      })
    })
  }

  const handleDelete = (inquiry: Inquiry) => {
    const confirmed = window.confirm(
      `Delete enquiry from “${inquiry.name}”? This cannot be undone.`,
    )
    if (!confirmed) return

    void withBusy(inquiry.id, async () => {
      await adminInquiryService.remove(inquiry.id)
      setInquiries((current) => current.filter((row) => row.id !== inquiry.id))
      setSelectedId((current) => (current === inquiry.id ? null : current))
      setFeedback({ tone: 'success', message: 'Enquiry deleted.' })
    })
  }

  return (
    <div className="admin-projects admin-inquiries">
      <header className="admin-projects__header">
        <div>
          <p className="admin-projects__eyebrow">Inbox</p>
          <h2 className="admin-projects__title">Inquiries</h2>
          <p className="admin-projects__lede">
            Contact form submissions from the public site. New messages are
            highlighted until you open them.
          </p>
        </div>
      </header>

      {feedback ? (
        <p
          className={`admin-projects__feedback admin-projects__feedback--${feedback.tone}`}
          role="status"
        >
          {feedback.message}
        </p>
      ) : null}

      <div
        className="admin-inquiries__filters"
        role="tablist"
        aria-label="Filter by status"
      >
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={filter === item.value}
            className={`admin-inquiries__filter${filter === item.value ? ' is-active' : ''}`}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="admin-projects__status">Loading inquiries…</p>
      ) : null}

      {error ? (
        <div className="admin-projects__alert" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="admin-projects__retry"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !error && inquiries.length === 0 ? (
        <div className="admin-projects__empty">
          <h3 className="admin-projects__empty-title">No inquiries yet</h3>
          <p className="admin-projects__empty-copy">
            {filter === 'all'
              ? 'When someone submits the contact form, their message will appear here.'
              : `No ${filter} inquiries in this view.`}
          </p>
        </div>
      ) : null}

      {!loading && !error && inquiries.length > 0 ? (
        <div className="admin-inquiries__layout">
          <div className="admin-projects__table-wrap">
            <table className="admin-projects__table admin-inquiries__table">
              <thead>
                <tr>
                  <th scope="col">From</th>
                  <th scope="col">Subject</th>
                  <th scope="col">Status</th>
                  <th scope="col">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inquiry) => {
                  const isSelected = inquiry.id === selectedId
                  const isNew = inquiry.status === 'new'
                  return (
                    <tr
                      key={inquiry.id}
                      className={[
                        isSelected ? 'is-selected' : '',
                        isNew ? 'is-new' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <td data-label="From">
                        <button
                          type="button"
                          className="admin-inquiries__row-btn"
                          onClick={() => openInquiry(inquiry)}
                        >
                          <span className="admin-projects__name">
                            {isNew ? (
                              <span className="admin-inquiries__dot" aria-hidden="true" />
                            ) : null}
                            {inquiry.name}
                          </span>
                          <span className="admin-projects__slug">{inquiry.email}</span>
                        </button>
                      </td>
                      <td data-label="Subject">
                        {inquiry.subject?.trim() || '—'}
                      </td>
                      <td data-label="Status">
                        <span
                          className={`admin-projects__pill admin-inquiries__pill--${inquiry.status}`}
                        >
                          {statusLabel(inquiry.status)}
                        </span>
                      </td>
                      <td data-label="Submitted">{formatDate(inquiry.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <aside className="admin-inquiries__detail" aria-live="polite">
            {selected ? (
              <>
                <header className="admin-inquiries__detail-header">
                  <p className="admin-projects__eyebrow">Message</p>
                  <h3 className="admin-inquiries__detail-title">{selected.name}</h3>
                  <p className="admin-inquiries__detail-meta">
                    <a href={`mailto:${selected.email}`}>{selected.email}</a>
                    {selected.phone ? (
                      <>
                        {' · '}
                        <a href={`tel:${selected.phone}`}>{selected.phone}</a>
                      </>
                    ) : null}
                  </p>
                  <p className="admin-inquiries__detail-meta">
                    {selected.subject?.trim() || 'No subject'} ·{' '}
                    {formatDate(selected.createdAt)}
                  </p>
                </header>

                <div className="admin-inquiries__message">
                  <p>{selected.message}</p>
                </div>

                <div className="admin-projects__actions admin-inquiries__actions">
                  {selected.status === 'new' || selected.status === 'read' ? (
                    <button
                      type="button"
                      className="admin-projects__action"
                      disabled={busyId === selected.id}
                      onClick={() => handleStatus(selected, 'replied')}
                    >
                      Mark replied
                    </button>
                  ) : null}
                  {selected.status !== 'read' && selected.status !== 'archived' ? (
                    <button
                      type="button"
                      className="admin-projects__action"
                      disabled={busyId === selected.id}
                      onClick={() => handleStatus(selected, 'read')}
                    >
                      Mark read
                    </button>
                  ) : null}
                  {selected.status === 'archived' ? (
                    <button
                      type="button"
                      className="admin-projects__action"
                      disabled={busyId === selected.id}
                      onClick={() => handleStatus(selected, 'read')}
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-projects__action"
                      disabled={busyId === selected.id}
                      onClick={() => handleStatus(selected, 'archived')}
                    >
                      Archive
                    </button>
                  )}
                  <button
                    type="button"
                    className="admin-projects__action admin-projects__action--danger"
                    disabled={busyId === selected.id}
                    onClick={() => handleDelete(selected)}
                  >
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <p className="admin-projects__status">Select an enquiry to read it.</p>
            )}
          </aside>
        </div>
      ) : null}
    </div>
  )
}

export default AdminInquiriesPage
