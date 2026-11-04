/**
 * SÅGÊ Digital — public inquiry intake (Stage 10.3 corrections)
 *
 * Deploy: `supabase functions deploy submit-inquiry`
 * Secrets (never in Vite):
 *   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
 *   supabase secrets set INQUIRY_RATE_LIMIT_SECRET=...   # long random string
 *
 * Apply migration: 20260406120000_inquiry_rate_limit_rpc.sql
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import {
  MAX_BODY_BYTES,
  MAX_PER_EMAIL_PER_HOUR,
  MAX_PER_IP_PER_HOUR,
  WINDOW_SECONDS,
  buildRateLimitKeys,
  isHoneypotFilled,
  parseJsonObject,
  readRequestTextLimited,
  resolveClientIp,
  validateInquiryPayload,
  type InquiryBody,
} from './helpers.ts'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(
  status: number,
  body: Record<string, unknown>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, {
      ok: false,
      message: 'Method not allowed.',
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const rateLimitSecret = Deno.env.get('INQUIRY_RATE_LIMIT_SECRET') ?? ''

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[submit-inquiry] missing service configuration')
    return jsonResponse(503, {
      ok: false,
      message: 'Enquiry delivery is temporarily unavailable.',
    })
  }

  if (!rateLimitSecret || rateLimitSecret.length < 16) {
    console.error('[submit-inquiry] missing or weak INQUIRY_RATE_LIMIT_SECRET')
    return jsonResponse(503, {
      ok: false,
      message: 'Enquiry delivery is temporarily unavailable.',
    })
  }

  const bodyRead = await readRequestTextLimited(req, MAX_BODY_BYTES)
  if (!bodyRead.ok) {
    return jsonResponse(bodyRead.status, {
      ok: false,
      message: bodyRead.message,
    })
  }

  const parsed = parseJsonObject(bodyRead.text)
  if ('error' in parsed) {
    return jsonResponse(400, { ok: false, message: parsed.error })
  }
  const body = parsed as InquiryBody

  const successMessage =
    'Thank you — your enquiry has been received. We will get back to you soon.'

  // Honeypot: pretend success; do not rate-limit or persist.
  if (isHoneypotFilled(body)) {
    return jsonResponse(200, {
      ok: true,
      suppressed: true,
      message: successMessage,
    })
  }

  const validated = validateInquiryPayload(body)
  if ('error' in validated) {
    return jsonResponse(400, { ok: false, message: validated.error })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { ip } = resolveClientIp(req.headers)

  let ipKey: string
  let emailKey: string
  try {
    ;({ ipKey, emailKey } = await buildRateLimitKeys({
      secret: rateLimitSecret,
      ip,
      email: validated.email,
    }))
  } catch {
    console.error('[submit-inquiry] rate-limit key derivation failed')
    return jsonResponse(503, {
      ok: false,
      message: 'Enquiry delivery is temporarily unavailable.',
    })
  }

  const { data: throttleResult, error: throttleError } = await admin.rpc(
    'consume_inquiry_rate_limit',
    {
      p_ip_key: ipKey,
      p_email_key: emailKey,
      p_ip_max: MAX_PER_IP_PER_HOUR,
      p_email_max: MAX_PER_EMAIL_PER_HOUR,
      p_window_seconds: WINDOW_SECONDS,
    },
  )

  if (throttleError || !throttleResult) {
    console.error('[submit-inquiry] rate-limit rpc failed')
    return jsonResponse(503, {
      ok: false,
      message: 'Enquiry delivery is temporarily unavailable.',
    })
  }

  const allowed =
    typeof throttleResult === 'object' &&
    throttleResult !== null &&
    'allowed' in throttleResult &&
    (throttleResult as { allowed?: unknown }).allowed === true

  if (!allowed) {
    const reason =
      typeof throttleResult === 'object' &&
      throttleResult !== null &&
      'reason' in throttleResult &&
      typeof (throttleResult as { reason?: unknown }).reason === 'string'
        ? (throttleResult as { reason: string }).reason
        : 'limited'

    const message =
      reason === 'email_limited'
        ? 'Too many enquiries for this email. Please try again later.'
        : 'Too many enquiries from this network. Please try again later.'

    return jsonResponse(429, { ok: false, message })
  }

  const { error: insertError } = await admin.from('inquiries').insert({
    name: validated.name,
    email: validated.email,
    phone: validated.phone,
    subject: validated.subject,
    message: validated.message,
    status: 'new',
  })

  if (insertError) {
    console.error('[submit-inquiry] insert failed', insertError.code)
    if (insertError.code === '23514') {
      return jsonResponse(400, {
        ok: false,
        message:
          'Your enquiry could not be saved. Check the fields and try again.',
      })
    }
    return jsonResponse(500, {
      ok: false,
      message:
        'Unable to submit your enquiry right now. Please try again or use email.',
    })
  }

  return jsonResponse(200, {
    ok: true,
    suppressed: false,
    message: successMessage,
  })
})
