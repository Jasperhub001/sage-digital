/** Pure helpers for submit-inquiry (also covered by Vitest). */

export const MAX_BODY_BYTES = 50 * 1024
export const MAX_PER_IP_PER_HOUR = 5
export const MAX_PER_EMAIL_PER_HOUR = 3
export const WINDOW_SECONDS = 3600

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type ClientIpResult = {
  /** Null when no usable IP could be derived. */
  ip: string | null
  /**
   * - cf-connecting-ip: Cloudflare single-IP header (preferred when present)
   * - x-forwarded-for: first hop (Supabase-documented shape; spoofable without a sanitizing edge)
   * - missing: no header; callers must use a dedicated rate-limit bucket
   */
  source: 'cf-connecting-ip' | 'x-forwarded-for' | 'missing'
}

export function resolveClientIp(headers: Headers): ClientIpResult {
  const cf = headers.get('cf-connecting-ip')?.trim()
  if (cf && looksLikeIpToken(cf)) {
    return { ip: cf, source: 'cf-connecting-ip' }
  }

  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded
      .split(',')
      .map((part) => part.trim())
      .find((part) => part.length > 0)
    if (first && looksLikeIpToken(first)) {
      return { ip: first, source: 'x-forwarded-for' }
    }
  }

  return { ip: null, source: 'missing' }
}

function looksLikeIpToken(value: string): boolean {
  // Accept IPv4 / IPv6-ish tokens; reject obvious header injection.
  if (value.length > 64) return false
  if (/[\s/;]/.test(value)) return false
  return true
}

export function sanitizeInquiryField(value: string, max: number): string {
  let output = ''
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code === 9 || code === 10 || code === 13) {
      output += value[index]
      continue
    }
    if (
      code <= 8 ||
      (code >= 11 && code <= 12) ||
      (code >= 14 && code <= 31) ||
      code === 127
    ) {
      continue
    }
    output += value[index]
  }
  return output.trim().slice(0, max)
}

export type InquiryBody = {
  name?: unknown
  email?: unknown
  phone?: unknown
  subject?: unknown
  message?: unknown
  website?: unknown
}

export type ValidatedInquiry = {
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function validateInquiryPayload(
  body: InquiryBody,
): ValidatedInquiry | { error: string } {
  const name = sanitizeInquiryField(asString(body.name), 120)
  const email = sanitizeInquiryField(asString(body.email), 254).toLowerCase()
  const message = sanitizeInquiryField(asString(body.message), 5000)
  const subjectRaw = sanitizeInquiryField(asString(body.subject), 160)
  const phoneRaw = sanitizeInquiryField(asString(body.phone), 40)

  if (name.length < 2) return { error: 'Please enter a valid name.' }
  if (!EMAIL_PATTERN.test(email)) {
    return { error: 'Please enter a valid email address.' }
  }
  if (message.length < 20) {
    return { error: 'Please share a few more project details.' }
  }
  if (phoneRaw && (phoneRaw.length < 7 || phoneRaw.length > 40)) {
    return { error: 'Please enter a valid phone number.' }
  }

  return {
    name,
    email,
    phone: phoneRaw || null,
    subject: subjectRaw || null,
    message,
  }
}

export function isHoneypotFilled(body: InquiryBody): boolean {
  return Boolean(sanitizeInquiryField(asString(body.website), 200))
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/** HMAC-SHA256 hex digest. Secret must be non-empty. */
export async function hmacSha256Hex(
  secret: string,
  message: string,
): Promise<string> {
  if (!secret) {
    throw new Error('missing_hmac_secret')
  }
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message),
  )
  return toHex(signature)
}

/**
 * Domain-separated rate-limit bucket keys (v2 HMAC).
 * Old plain-SHA keys will not match → fresh windows after deploy (fail-safe).
 */
export async function buildRateLimitKeys(options: {
  secret: string
  ip: string | null
  email: string
}): Promise<{ ipKey: string; emailKey: string }> {
  const ipMaterial = options.ip
    ? `inquiry-rate:v2:ip:${options.ip}`
    : 'inquiry-rate:v2:ip:missing'
  const emailMaterial = `inquiry-rate:v2:email:${options.email}`

  const [ipHash, emailHash] = await Promise.all([
    hmacSha256Hex(options.secret, ipMaterial),
    hmacSha256Hex(options.secret, emailMaterial),
  ])

  return {
    ipKey: `v2:ip:${ipHash}`,
    emailKey: `v2:email:${emailHash}`,
  }
}

export type ReadBodyResult =
  | { ok: true; text: string }
  | { ok: false; status: 413 | 400; message: string }

/**
 * Read at most maxBytes from the request body.
 * Honors Content-Length when present; always counts streamed bytes.
 */
export async function readRequestTextLimited(
  req: Request,
  maxBytes: number,
): Promise<ReadBodyResult> {
  const declared = req.headers.get('content-length')
  if (declared) {
    const length = Number(declared)
    if (Number.isFinite(length) && length > maxBytes) {
      return {
        ok: false,
        status: 413,
        message: 'Request body too large.',
      }
    }
  }

  if (!req.body) {
    return { ok: true, text: '' }
  }

  const reader = req.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    total += value.byteLength
    if (total > maxBytes) {
      try {
        await reader.cancel()
      } catch {
        // ignore cancel errors
      }
      return {
        ok: false,
        status: 413,
        message: 'Request body too large.',
      }
    }
    chunks.push(value)
  }

  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }

  try {
    return { ok: true, text: new TextDecoder().decode(merged) }
  } catch {
    return { ok: false, status: 400, message: 'Invalid request.' }
  }
}

export function parseJsonObject(text: string): InquiryBody | { error: string } {
  if (!text.trim()) {
    return { error: 'Invalid request.' }
  }
  try {
    const parsed: unknown = JSON.parse(text)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { error: 'Invalid request.' }
    }
    return parsed as InquiryBody
  } catch {
    return { error: 'Invalid request.' }
  }
}

/** In-memory model mirroring SQL dual-bucket atomic consume (for concurrency tests). */
export type MemoryThrottleRow = {
  windowStartedAtMs: number
  hitCount: number
}

export function consumeDualRateLimitMemory(
  store: Map<string, MemoryThrottleRow>,
  ipKey: string,
  emailKey: string,
  options: {
    ipMax: number
    emailMax: number
    windowMs: number
    nowMs: number
  },
): { allowed: boolean; reason: string } {
  const ensure = (key: string) => {
    if (!store.has(key)) {
      store.set(key, { windowStartedAtMs: options.nowMs, hitCount: 0 })
    }
  }
  ensure(ipKey)
  ensure(emailKey)

  // Simulate lexicographic lock order (single-threaded JS uses store mutation order).
  const keys = ipKey < emailKey ? [ipKey, emailKey] : [emailKey, ipKey]
  for (const key of keys) {
    void store.get(key)
  }

  const ipRow = store.get(ipKey)!
  const emailRow = store.get(emailKey)!

  const ipEffective =
    options.nowMs - ipRow.windowStartedAtMs >= options.windowMs
      ? 0
      : ipRow.hitCount
  const emailEffective =
    options.nowMs - emailRow.windowStartedAtMs >= options.windowMs
      ? 0
      : emailRow.hitCount

  if (ipEffective >= options.ipMax) {
    return { allowed: false, reason: 'ip_limited' }
  }
  if (emailEffective >= options.emailMax) {
    return { allowed: false, reason: 'email_limited' }
  }

  if (options.nowMs - ipRow.windowStartedAtMs >= options.windowMs) {
    ipRow.windowStartedAtMs = options.nowMs
    ipRow.hitCount = 1
  } else {
    ipRow.hitCount = ipEffective + 1
  }

  if (options.nowMs - emailRow.windowStartedAtMs >= options.windowMs) {
    emailRow.windowStartedAtMs = options.nowMs
    emailRow.hitCount = 1
  } else {
    emailRow.hitCount = emailEffective + 1
  }

  return { allowed: true, reason: 'ok' }
}
