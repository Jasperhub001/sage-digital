import { useEffect, useId, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { resolveAdminReturnPath } from '../../lib/auth/adminRole'
import { useAuth } from '../../hooks/useAuth'
import './AdminLoginPage.css'

function AdminLoginPage() {
  const { isLoading, isAdmin, isConfigured, session, signIn, signOut } =
    useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const emailId = useId()
  const passwordId = useId()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = resolveAdminReturnPath(
    typeof location.state === 'object' &&
      location.state !== null &&
      'from' in location.state
      ? (location.state as { from?: unknown }).from
      : '/admin',
  )

  useEffect(() => {
    document.title = 'Admin sign in — SÅGÊ Digital'
    return () => {
      document.title = 'SÅGÊ Digital — Digital Experiences That Move Businesses Forward'
    }
  }, [])

  if (!isLoading && isAdmin) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    setError(null)
    setSubmitting(true)

    try {
      const result = await signIn(email, password)
      if (result.ok === false) {
        setError(result.message)
        return
      }

      if (!result.isAdmin) {
        // AuthProvider already cleared the non-admin session.
        setError(
          'This account is not authorized for administrator access.',
        )
        return
      }

      navigate(from, { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login__atmosphere" aria-hidden="true" />
      <div className="admin-login__panel">
        <header className="admin-login__header">
          <p className="admin-login__brand">SÅGÊ Digital</p>
          <h1 className="admin-login__title">Administrator</h1>
          <p className="admin-login__lede">
            Private access for content management. Accounts are provisioned
            separately — there is no public registration.
          </p>
        </header>

        {!isConfigured ? (
          <p className="admin-login__alert" role="alert">
            Admin sign-in is unavailable because Supabase is not configured in
            this environment.
          </p>
        ) : null}

        {isLoading ? (
          <p className="admin-login__status" role="status">
            Restoring session…
          </p>
        ) : null}

        {!isLoading && isConfigured && session && !isAdmin ? (
          <div className="admin-login__denied">
            <p className="admin-login__alert" role="alert">
              You are signed in, but this account is not an administrator.
              Sign out, then use a provisioned admin account.
            </p>
            <button
              type="button"
              className="admin-login__submit"
              onClick={() => {
                void signOut()
              }}
            >
              Sign out
            </button>
          </div>
        ) : null}

        {!isLoading && isConfigured && !session ? (
          <form className="admin-login__form" onSubmit={handleSubmit} noValidate>
            <div className="admin-login__field">
              <label className="admin-login__label" htmlFor={emailId}>
                Email
              </label>
              <input
                id={emailId}
                className="admin-login__input"
                type="email"
                name="email"
                autoComplete="username"
                inputMode="email"
                required
                value={email}
                disabled={submitting}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="admin-login__field">
              <label className="admin-login__label" htmlFor={passwordId}>
                Password
              </label>
              <input
                id={passwordId}
                className="admin-login__input"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                disabled={submitting}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error ? (
              <p className="admin-login__alert" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="admin-login__submit"
              disabled={submitting}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : null}

        <p className="admin-login__footer">
          <Link to="/" className="admin-login__back">
            ← Back to website
          </Link>
        </p>
      </div>
    </div>
  )
}

export default AdminLoginPage
