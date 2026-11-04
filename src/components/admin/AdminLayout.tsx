import { useEffect, useId, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ADMIN_NAV } from '../../admin/nav'
import { useAuth } from '../../hooks/useAuth'
import './AdminLayout.css'

function titleForPath(pathname: string): string {
  if (pathname === '/admin/projects/new') return 'Add project'
  if (/^\/admin\/projects\/[^/]+\/edit$/.test(pathname)) return 'Edit project'
  if (pathname === '/admin/services/new') return 'Add service'
  if (/^\/admin\/services\/[^/]+\/edit$/.test(pathname)) return 'Edit service'

  const match = ADMIN_NAV.find((item) =>
    item.end ? pathname === item.to : pathname.startsWith(item.to),
  )
  return match?.label ?? 'Admin'
}

function AdminLayout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  // Location-keyed: changing routes closes the drawer without an effect.
  const [navOpenForPath, setNavOpenForPath] = useState<string | null>(null)
  const navOpen = navOpenForPath === location.pathname
  const navId = useId()
  const pageTitle = titleForPath(location.pathname)

  useEffect(() => {
    document.title = `${pageTitle} — Admin — SÅGÊ Digital`
  }, [pageTitle])

  useEffect(() => {
    if (!navOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpenForPath(null)
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [navOpen])

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className={`admin-shell${navOpen ? ' is-nav-open' : ''}`}>
      <a className="admin-shell__skip" href="#admin-main">
        Skip to admin content
      </a>

      <button
        type="button"
        className="admin-shell__backdrop"
        aria-label="Close navigation"
        tabIndex={navOpen ? 0 : -1}
        onClick={() => setNavOpenForPath(null)}
      />

      <aside
        id={navId}
        className="admin-shell__sidebar"
        aria-label="Admin navigation"
      >
        <div className="admin-shell__brand">
          <p className="admin-shell__brand-name">SÅGÊ Digital</p>
          <p className="admin-shell__brand-meta">Admin</p>
        </div>

        <nav className="admin-shell__nav" aria-label="Dashboard">
          <ul className="admin-shell__nav-list">
            {ADMIN_NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `admin-shell__nav-link${isActive ? ' is-active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="admin-shell__sidebar-footer">
          <NavLink to="/" className="admin-shell__site-link">
            View public site
          </NavLink>
        </div>
      </aside>

      <div className="admin-shell__main">
        <header className="admin-shell__header">
          <div className="admin-shell__header-start">
            <button
              type="button"
              className="admin-shell__menu"
              aria-expanded={navOpen}
              aria-controls={navId}
              onClick={() =>
                setNavOpenForPath((current) =>
                  current === location.pathname ? null : location.pathname,
                )
              }
            >
              <span className="admin-shell__menu-bars" aria-hidden="true" />
              <span className="sr-only">
                {navOpen ? 'Close navigation' : 'Open navigation'}
              </span>
            </button>
            <h1 className="admin-shell__title">{pageTitle}</h1>
          </div>

          <div className="admin-shell__header-end">
            {user?.email ? (
              <p className="admin-shell__email" title={user.email}>
                {user.email}
              </p>
            ) : null}
            <button
              type="button"
              className="admin-shell__logout"
              onClick={() => {
                void handleSignOut()
              }}
            >
              Sign out
            </button>
          </div>
        </header>

        <main id="admin-main" className="admin-shell__content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
