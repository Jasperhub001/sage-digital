import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { resolveAdminReturnPath } from '../../lib/auth/adminRole'
import { useAuth } from '../../hooks/useAuth'
import './RequireAdmin.css'

/**
 * Layout route gate for `/admin/*`.
 * Client gate only — Supabase RLS remains the authorization boundary.
 * - Unauthenticated → `/admin/login`
 * - Authenticated without app_metadata.role === 'admin' → denied
 * - Admin → nested routes via <Outlet />
 */
function RequireAdmin() {
  const { isLoading, session, isAdmin, signOut } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="admin-gate" role="status" aria-live="polite">
        <p className="admin-gate__status">Checking session…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: resolveAdminReturnPath(location.pathname) }}
      />
    )
  }

  // Session without admin claim: never render protected outlets.
  if (!isAdmin) {
    return (
      <div className="admin-gate admin-gate--denied">
        <p className="admin-gate__eyebrow">Access denied</p>
        <h1 className="admin-gate__title">Administrator privileges required</h1>
        <p className="admin-gate__copy">
          This account is signed in but is not authorized to manage SÅGÊ Digital
          content. Authorization uses server-managed{' '}
          <code>app_metadata.role</code> only.
        </p>
        <button
          type="button"
          className="admin-gate__button"
          onClick={() => {
            void signOut()
          }}
        >
          Sign out
        </button>
      </div>
    )
  }

  return <Outlet />
}

export default RequireAdmin
