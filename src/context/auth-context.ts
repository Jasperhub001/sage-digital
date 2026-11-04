import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { AuthResult } from '../lib/auth/authService'

export interface AuthContextValue {
  session: Session | null
  user: User | null
  isAdmin: boolean
  isConfigured: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
