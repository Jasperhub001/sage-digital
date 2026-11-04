type ContentKind = 'projects' | 'services'
type DataSource =
  | 'supabase'
  | 'local-fallback'
  | 'local-fallback-after-error'

/**
 * Development-only diagnostics for Stage 8.3 verification.
 * Never logs credentials, row payloads, or secrets.
 */
export function logContentDataSource(
  kind: ContentKind,
  source: DataSource,
  meta?: { count?: number; reason?: string },
): void {
  if (!import.meta.env.DEV) return

  const details: Record<string, string | number> = { source }
  if (typeof meta?.count === 'number') details.count = meta.count
  if (meta?.reason) details.reason = meta.reason

  console.info(`[content:${kind}]`, details)
}
