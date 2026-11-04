import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isAdminUser } from '../lib/auth/adminRole'
import {
  getValidatedSession,
  signInWithPassword,
  signOut as authSignOut,
  subscribeToAuthChanges,
} from '../lib/auth/authService'
import { isSupabaseConfigured } from '../lib/supabase/client'
import { AuthContext, type AuthContextValue } from './auth-context'
import type { Session } from '@supabase/supabase-js'

async function retainAdminSessionOnly(
  next: Session | null,
): Promise<Session | null> {
  if (!next) return null
  if (isAdminUser(next.user)) return next
  // This app only uses Auth for administrators — drop non-admin sessions.
  await authSignOut()
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthContextValue['session']>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isConfigured = isSupabaseConfigured()

  useEffect(() => {
    let cancelled = false
    let unsubscribe: (() => void) | undefined

    async function restore() {
      if (!isConfigured) {
        if (!cancelled) {
          setSession(null)
          setIsLoading(false)
        }
        return
      }

      try {
        const current = await getValidatedSession()
        const retained = await retainAdminSessionOnly(current)
        if (!cancelled) setSession(retained)
        unsubscribe = await subscribeToAuthChanges((next) => {
          void retainAdminSessionOnly(next).then((retainedNext) => {
            if (!cancelled) setSession(retainedNext)
          })
        })
      } catch {
        if (!cancelled) setSession(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void restore()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [isConfigured])

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await signInWithPassword(email, password)

    if (result.ok && result.isAdmin) {
      setSession(result.session)
      return result
    }

    if (result.ok && !result.isAdmin) {
      await authSignOut()
      setSession(null)
      return result
    }

    return result
  }, [])

  const signOut = useCallback(async () => {
    await authSignOut()
    setSession(null)
  }, [])

  const user = session?.user ?? null
  const isAdmin = isAdminUser(user)

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      isAdmin,
      isConfigured,
      isLoading,
      signIn,
      signOut,
    }),
    [session, user, isAdmin, isConfigured, isLoading, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
