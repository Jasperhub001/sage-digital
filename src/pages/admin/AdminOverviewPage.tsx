import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getAdminOverviewStats,
  type AdminOverviewStats,
  type OverviewMetric,
} from '../../services/adminOverviewService'
import './AdminOverviewPage.css'

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; stats: AdminOverviewStats }
  | { status: 'error'; message: string }

function formatMetric(metric: OverviewMetric): string {
  if (metric.status === 'ready') return String(metric.value)
  return '—'
}

function metricNote(metric: OverviewMetric): string | null {
  if (metric.status === 'ready') return null
  return metric.reason
}

function AdminOverviewPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function load() {
      setState({ status: 'loading' })
      try {
        const stats = await getAdminOverviewStats()
        if (!cancelled) setState({ status: 'ready', stats })
      } catch {
        if (!cancelled) {
          setState({
            status: 'error',
            message: 'Unable to load overview statistics.',
          })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const cards =
    state.status === 'ready'
      ? [
          {
            key: 'published-projects',
            label: 'Published projects',
            metric: state.stats.publishedProjects,
            href: '/admin/projects',
          },
          {
            key: 'draft-projects',
            label: 'Draft projects',
            metric: state.stats.draftProjects,
            href: '/admin/projects',
          },
          {
            key: 'published-services',
            label: 'Published services',
            metric: state.stats.publishedServices,
            href: '/admin/services',
          },
          {
            key: 'total-inquiries',
            label: 'Total inquiries',
            metric: state.stats.totalInquiries,
            href: '/admin/inquiries',
          },
        ]
      : []

  return (
    <div className="admin-overview">
      <header className="admin-overview__intro">
        <p className="admin-overview__eyebrow">Dashboard</p>
        <h2 className="admin-overview__heading">Content at a glance</h2>
        <p className="admin-overview__lede">
          Counts come from your Supabase project under administrator RLS.
          Unavailable metrics stay labelled honestly until their data source
          exists.
        </p>
      </header>

      {state.status === 'loading' ? (
        <p className="admin-overview__status" role="status">
          Loading overview…
        </p>
      ) : null}

      {state.status === 'error' ? (
        <p className="admin-overview__alert" role="alert">
          {state.message}
        </p>
      ) : null}

      {state.status === 'ready' ? (
        <ul className="admin-overview__grid">
          {cards.map((card) => {
            const note = metricNote(card.metric)
            return (
              <li key={card.key} className="admin-overview__card">
                <p className="admin-overview__label">{card.label}</p>
                <p
                  className={`admin-overview__value${
                    card.metric.status !== 'ready'
                      ? ' admin-overview__value--muted'
                      : ''
                  }`}
                >
                  {formatMetric(card.metric)}
                </p>
                {note ? (
                  <p className="admin-overview__note">{note}</p>
                ) : (
                  <p className="admin-overview__note admin-overview__note--ok">
                    Live from Supabase
                  </p>
                )}
                <Link className="admin-overview__link" to={card.href}>
                  Open {card.label.toLowerCase().includes('project')
                    ? 'projects'
                    : card.label.toLowerCase().includes('service')
                      ? 'services'
                      : card.label.toLowerCase().includes('inquir')
                        ? 'inquiries'
                        : 'section'}
                </Link>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

export default AdminOverviewPage
