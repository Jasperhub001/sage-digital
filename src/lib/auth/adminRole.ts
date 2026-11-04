import type { User } from '@supabase/supabase-js'

/**
 * Trusted administrator check.
 *
 * Only `app_metadata.role` is consulted. That claim is set by the Supabase
 * service (Dashboard / Admin API / service role) and cannot be edited by the
 * end user via `auth.updateUser`.
 *
 * Never use `user_metadata`, localStorage flags, or client-only claims.
 */
export function isAdminUser(user: User | null | undefined): boolean {
  if (!user) return false

  // Explicitly ignore user_metadata even if a "role" key is present there.
  const role = user.app_metadata?.role
  return role === 'admin'
}

/**
 * Safe post-login return path for admin routes.
 * Rejects open redirects and non-admin destinations.
 */
export function resolveAdminReturnPath(candidate: unknown): string {
  if (typeof candidate !== 'string') return '/admin'

  const path = candidate.trim()
  if (!path.startsWith('/admin')) return '/admin'
  if (path.startsWith('//')) return '/admin'
  if (path.includes('\\') || path.includes('@') || path.includes('://')) {
    return '/admin'
  }
  if (path === '/admin/login' || path.startsWith('/admin/login/')) {
    return '/admin'
  }
  // Allow /admin and nested path segments only (no query/hash injection).
  if (!/^\/admin(?:\/[A-Za-z0-9._-]+)*$/.test(path)) {
    return '/admin'
  }

  return path
}
