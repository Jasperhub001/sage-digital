import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

function decodeJwtPayload(key: string): { role?: string } | null {
  const parts = key.split('.')
  if (parts.length < 2 || !parts[1]) return null

  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(atob(padded)) as { role?: string }
  } catch {
    return null
  }
}

/**
 * Reject secret / service-role credentials that must never ship in Vite.
 * Supports both legacy JWT keys and the newer `sb_*` key formats.
 */
function isForbiddenFrontendKey(key: string): boolean {
  if (key.startsWith('sb_secret_')) return true

  const payload = decodeJwtPayload(key)
  if (payload?.role === 'service_role') return true

  return false
}

/**
 * Accept browser-safe publishable credentials:
 * - new format: `sb_publishable_...`
 * - legacy JWT anon key (role "anon")
 */
function isAllowedFrontendKey(key: string): boolean {
  if (isForbiddenFrontendKey(key)) return false

  if (key.startsWith('sb_publishable_')) return true

  const payload = decodeJwtPayload(key)
  if (payload?.role === 'anon') return true

  // Legacy anon keys are JWTs; if it looks like a JWT but isn't anon/service_role,
  // reject rather than guessing.
  if (key.includes('.') && payload !== null) return false

  return false
}

function hasValidSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.hostname === 'localhost'
  } catch {
    return false
  }
}

/** True when both public Vite env values are present and safe for the browser. */
export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl || !supabaseAnonKey) return false

  if (isForbiddenFrontendKey(supabaseAnonKey) || !isAllowedFrontendKey(supabaseAnonKey)) {
    console.error(
      '[supabase] Refusing to initialize: VITE_SUPABASE_ANON_KEY must be a publishable key (`sb_publishable_...`) or legacy anon JWT. Secret / service_role keys are not allowed in the frontend.',
    )
    return false
  }

  if (!hasValidSupabaseUrl(supabaseUrl)) {
    console.error(
      '[supabase] Refusing to initialize: VITE_SUPABASE_URL is missing or invalid. Falling back to local data.',
    )
    return false
  }

  return true
}

let client: SupabaseClient<Database> | null = null
let clientPromise: Promise<SupabaseClient<Database> | null> | null = null

/**
 * Returns a browser-safe Supabase client, or `null` when env vars are missing/unsafe.
 * Loaded dynamically so local-fallback builds do not eagerly ship the SDK.
 */
export async function getSupabaseClient(): Promise<SupabaseClient<Database> | null> {
  if (!isSupabaseConfigured()) return null
  if (client) return client

  if (!clientPromise) {
    clientPromise = (async () => {
      const { createClient } = await import('@supabase/supabase-js')
      client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          // Required for admin sessions; public pages ignore auth state.
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          // Passwords are never written to localStorage by the app —
          // only Supabase Auth session tokens managed by the SDK.
        },
      })
      return client
    })()
  }

  return clientPromise
}
