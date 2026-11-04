import { describe, expect, it } from 'vitest'
import {
  MAX_BODY_BYTES,
  MAX_PER_EMAIL_PER_HOUR,
  MAX_PER_IP_PER_HOUR,
  buildRateLimitKeys,
  consumeDualRateLimitMemory,
  hmacSha256Hex,
  isHoneypotFilled,
  parseJsonObject,
  readRequestTextLimited,
  resolveClientIp,
  validateInquiryPayload,
} from './helpers'

describe('resolveClientIp', () => {
  it('prefers cf-connecting-ip', () => {
    const headers = new Headers({
      'cf-connecting-ip': '203.0.113.10',
      'x-forwarded-for': '198.51.100.1, 203.0.113.10',
    })
    expect(resolveClientIp(headers)).toEqual({
      ip: '203.0.113.10',
      source: 'cf-connecting-ip',
    })
  })

  it('uses first x-forwarded-for hop when cf header absent', () => {
    const headers = new Headers({
      'x-forwarded-for': '198.51.100.7, 10.0.0.1',
    })
    expect(resolveClientIp(headers)).toEqual({
      ip: '198.51.100.7',
      source: 'x-forwarded-for',
    })
  })

  it('returns missing when no usable IP header exists', () => {
    expect(resolveClientIp(new Headers())).toEqual({
      ip: null,
      source: 'missing',
    })
  })
})

describe('hmac + rate-limit keys', () => {
  it('fails closed on empty secret', async () => {
    await expect(hmacSha256Hex('', 'msg')).rejects.toThrow('missing_hmac_secret')
  })

  it('uses domain separation so ip and email keys differ', async () => {
    const keys = await buildRateLimitKeys({
      secret: 'test-secret-value-32chars-min!!',
      ip: '203.0.113.10',
      email: 'user@example.com',
    })
    expect(keys.ipKey.startsWith('v2:ip:')).toBe(true)
    expect(keys.emailKey.startsWith('v2:email:')).toBe(true)
    expect(keys.ipKey).not.toEqual(keys.emailKey)
  })

  it('maps missing IP to a dedicated material bucket', async () => {
    const withIp = await buildRateLimitKeys({
      secret: 'test-secret-value-32chars-min!!',
      ip: '203.0.113.10',
      email: 'user@example.com',
    })
    const missing = await buildRateLimitKeys({
      secret: 'test-secret-value-32chars-min!!',
      ip: null,
      email: 'user@example.com',
    })
    expect(withIp.ipKey).not.toEqual(missing.ipKey)
    expect(withIp.emailKey).toEqual(missing.emailKey)
  })
})

describe('validateInquiryPayload + honeypot', () => {
  const valid = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    message: 'I would like a new marketing website for my studio.',
    subject: 'Websites',
    website: '',
  }

  it('accepts a valid payload', () => {
    const result = validateInquiryPayload(valid)
    expect(result).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    })
  })

  it('rejects invalid email', () => {
    const result = validateInquiryPayload({ ...valid, email: 'not-an-email' })
    expect(result).toEqual({ error: 'Please enter a valid email address.' })
  })

  it('detects filled honeypot', () => {
    expect(isHoneypotFilled({ ...valid, website: 'https://spam.test' })).toBe(
      true,
    )
    expect(isHoneypotFilled(valid)).toBe(false)
  })
})

describe('readRequestTextLimited + JSON parse', () => {
  it('rejects oversized Content-Length before reading', async () => {
    const req = new Request('https://example.test', {
      method: 'POST',
      headers: { 'content-length': String(MAX_BODY_BYTES + 1) },
      body: 'x',
    })
    const result = await readRequestTextLimited(req, MAX_BODY_BYTES)
    expect(result).toEqual({
      ok: false,
      status: 413,
      message: 'Request body too large.',
    })
  })

  it('rejects streamed bodies over the byte cap', async () => {
    const oversized = 'a'.repeat(MAX_BODY_BYTES + 10)
    const req = new Request('https://example.test', {
      method: 'POST',
      body: oversized,
    })
    const result = await readRequestTextLimited(req, MAX_BODY_BYTES)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.status).toBe(413)
  })

  it('parses valid JSON objects and rejects malformed JSON', () => {
    expect(parseJsonObject('{"name":"Ada"}')).toEqual({ name: 'Ada' })
    expect(parseJsonObject('{nope')).toEqual({ error: 'Invalid request.' })
    expect(parseJsonObject('[]')).toEqual({ error: 'Invalid request.' })
  })
})

describe('atomic dual rate-limit memory model', () => {
  const windowMs = 60 * 60 * 1000

  it('accepts a new IP/email pair and requests below the limit', () => {
    const store = new Map()
    const first = consumeDualRateLimitMemory(store, 'ip:a', 'email:a', {
      ipMax: MAX_PER_IP_PER_HOUR,
      emailMax: MAX_PER_EMAIL_PER_HOUR,
      windowMs,
      nowMs: 1_000,
    })
    expect(first.allowed).toBe(true)

    for (let i = 0; i < MAX_PER_EMAIL_PER_HOUR - 1; i += 1) {
      const next = consumeDualRateLimitMemory(store, 'ip:a', 'email:a', {
        ipMax: MAX_PER_IP_PER_HOUR,
        emailMax: MAX_PER_EMAIL_PER_HOUR,
        windowMs,
        nowMs: 1_000 + i,
      })
      expect(next.allowed).toBe(true)
    }
  })

  it('rejects the request exceeding the email limit without further IP growth', () => {
    const store = new Map()
    for (let i = 0; i < MAX_PER_EMAIL_PER_HOUR; i += 1) {
      consumeDualRateLimitMemory(store, 'ip:b', 'email:b', {
        ipMax: MAX_PER_IP_PER_HOUR,
        emailMax: MAX_PER_EMAIL_PER_HOUR,
        windowMs,
        nowMs: 2_000,
      })
    }
    const ipBefore = store.get('ip:b')!.hitCount
    const denied = consumeDualRateLimitMemory(store, 'ip:b', 'email:b', {
      ipMax: MAX_PER_IP_PER_HOUR,
      emailMax: MAX_PER_EMAIL_PER_HOUR,
      windowMs,
      nowMs: 2_001,
    })
    expect(denied).toEqual({ allowed: false, reason: 'email_limited' })
    expect(store.get('ip:b')!.hitCount).toBe(ipBefore)
  })

  it('resets expired windows', () => {
    const store = new Map()
    consumeDualRateLimitMemory(store, 'ip:c', 'email:c', {
      ipMax: 1,
      emailMax: 1,
      windowMs,
      nowMs: 10_000,
    })
    const denied = consumeDualRateLimitMemory(store, 'ip:c', 'email:c', {
      ipMax: 1,
      emailMax: 1,
      windowMs,
      nowMs: 10_001,
    })
    expect(denied.allowed).toBe(false)

    const reset = consumeDualRateLimitMemory(store, 'ip:c', 'email:c', {
      ipMax: 1,
      emailMax: 1,
      windowMs,
      nowMs: 10_000 + windowMs + 1,
    })
    expect(reset.allowed).toBe(true)
    expect(store.get('ip:c')!.hitCount).toBe(1)
  })

  it('serial concurrent consumes cannot exceed the configured limit', () => {
    const store = new Map()
    const nowMs = 50_000
    let allowed = 0
    // Simulate interleaved callers that each run the full atomic function.
    for (let i = 0; i < 20; i += 1) {
      const result = consumeDualRateLimitMemory(store, 'ip:d', 'email:d', {
        ipMax: MAX_PER_IP_PER_HOUR,
        emailMax: MAX_PER_EMAIL_PER_HOUR,
        windowMs,
        nowMs,
      })
      if (result.allowed) allowed += 1
    }
    expect(allowed).toBe(MAX_PER_EMAIL_PER_HOUR)
    expect(store.get('ip:d')!.hitCount).toBe(MAX_PER_EMAIL_PER_HOUR)
    expect(store.get('email:d')!.hitCount).toBe(MAX_PER_EMAIL_PER_HOUR)
  })
})
