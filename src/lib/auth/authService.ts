import type { AuthError, Session, User } from '@supabase/supabase-js'
import { getSupabaseClient } from '../supabase/client'
import { isAdminUser } from './adminRole'

export type AuthResult =
  | { ok: true; session: Session; user: User; isAdmin: boolean }
  | { ok: false; message: string }

const GENERIC_AUTH_FAILURE =
  'Unable to sign in. Check your email and password, then try again.'

const GENERIC_CONFIG_FAILURE =
  'Admin sign-in is unavailable. Supabase is not configured for this environment.'

function toSafeAuthMessage(error: AuthError | null | undefined): string {
  if (!error) return GENERIC_AUTH_FAILURE

  // Avoid leaking whether an email exists, lockout details, etc.
  const status = error.status
  if (status === 400 || status === 401 || status === 403 || status === 422) {
    return GENERIC_AUTH_FAILURE
  }

  if (error.message.toLowerCase().includes('invalid login')) {
    return GENERIC_AUTH_FAILURE
  }

  return GENERIC_AUTH_FAILURE
}

/**
 * Validate the current Auth user with the Supabase Auth server.
 * Prefer this over trusting localStorage `getSession()` alone for gate UI.
 * Returns null when the session is missing, expired, or rejected.
 */
export async function getValidatedSession(): Promise<Session | null> {
  const client = await getSupabaseClient()
  if (!client) return null

  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError || !userData.user) {
    return null
  }

  const { data: sessionData, error: sessionError } =
    await client.auth.getSession()
  if (sessionError || !sessionData.session) {
    return null
  }

  // Ensure the local session still matches the server-validated user.
  if (sessionData.session.user.id !== userData.user.id) {
    return null
  }

  return {
    ...sessionData.session,
    user: userData.user,
  }
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AuthResult> {
  const client = await getSupabaseClient()
  if (!client) {
    return { ok: false, message: GENERIC_CONFIG_FAILURE }
  }

  const trimmedEmail = email.trim()
  if (!trimmedEmail || !password) {
    return { ok: false, message: GENERIC_AUTH_FAILURE }
  }

  const { data, error } = await client.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  })

  if (error || !data.session || !data.user) {
    return { ok: false, message: toSafeAuthMessage(error) }
  }

  return {
    ok: true,
    session: data.session,
    user: data.user,
    isAdmin: isAdminUser(data.user),
  }
}

export async function signOut(): Promise<void> {
  const client = await getSupabaseClient()
  if (!client) return

  // Global scope invalidates the refresh token server-side when possible.
  await client.auth.signOut({ scope: 'global' })
}

export async function subscribeToAuthChanges(
  callback: (session: Session | null) => void,
): Promise<() => void> {
  const client = await getSupabaseClient()
  if (!client) {
    callback(null)
    return () => undefined
  }

  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      callback(null)
      return
    }

    // Prefer the Auth-server user payload carried on the event session.
    // TOKEN_REFRESHED / SIGNED_IN / USER_UPDATED all supply a session.
    callback(session)
  })

  return () => {
    subscription.unsubscribe()
  }
}
