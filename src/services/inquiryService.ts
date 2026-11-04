import { sanitizeInquiryText } from '../lib/inquiries/mappers'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase/client'
import type { Inquiry } from '../types/inquiry'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface PublicInquiryInput {
  name: string
  email: string
  phone?: string | null
  subject?: string | null
  message: string
  /** Honeypot — must stay empty. Bots that fill it are silently accepted. */
  website?: string
}

export interface PublicInquiryResult {
  ok: true
  inquiry: Inquiry | null
  suppressed: boolean
  message: string
}

function assertValidPublicInput(input: PublicInquiryInput): void {
  const name = sanitizeInquiryText(input.name, 120)
  const email = sanitizeInquiryText(input.email, 254)
  const message = sanitizeInquiryText(input.message, 5000)
  const subject = sanitizeInquiryText(input.subject ?? '', 160)
  const phone = sanitizeInquiryText(input.phone ?? '', 40)

  if (name.length < 2 || name.length > 120) {
    throw new Error('Please enter a valid name.')
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw new Error('Please enter a valid email address.')
  }
  if (message.length < 20 || message.length > 5000) {
    throw new Error('Please share a few more project details.')
  }
  if (subject.length > 160) {
    throw new Error('Subject is too long.')
  }
  if (phone && (phone.length < 7 || phone.length > 40)) {
    throw new Error('Please enter a valid phone number.')
  }
}

interface EdgeInquiryResponse {
  ok?: boolean
  suppressed?: boolean
  message?: string
}

function mapInvokeFailure(status: number | undefined, payload: EdgeInquiryResponse | null): Error {
  if (status === 429) {
    return new Error(
      payload?.message?.trim() ||
        'Too many enquiries. Please try again later.',
    )
  }
  if (status === 400) {
    return new Error(
      payload?.message?.trim() ||
        'Your enquiry could not be saved. Check the fields and try again.',
    )
  }
  return new Error(
    payload?.message?.trim() ||
      'Unable to submit your enquiry right now. Please try again or use email.',
  )
}

/**
 * Public contact submission via the `submit-inquiry` Edge Function.
 * Direct table INSERT is revoked for anon — rate limiting + validation run server-side.
 * Honeypot filled → fake success (no network write required when caught client-side).
 */
export async function createPublicInquiry(
  input: PublicInquiryInput,
  successMessage: string,
): Promise<PublicInquiryResult> {
  if (input.website?.trim()) {
    await Promise.resolve()
    return {
      ok: true,
      inquiry: null,
      suppressed: true,
      message: successMessage,
    }
  }

  assertValidPublicInput(input)

  if (!isSupabaseConfigured()) {
    throw new Error(
      'Enquiry delivery is not configured. Please email us directly.',
    )
  }

  const client = await getSupabaseClient()
  if (!client) {
    throw new Error(
      'Enquiry delivery is not configured. Please email us directly.',
    )
  }

  const { data, error } = await client.functions.invoke<EdgeInquiryResponse>(
    'submit-inquiry',
    {
      body: {
        name: sanitizeInquiryText(input.name, 120),
        email: sanitizeInquiryText(input.email, 254).toLowerCase(),
        phone: input.phone ? sanitizeInquiryText(input.phone, 40) : null,
        subject: input.subject ? sanitizeInquiryText(input.subject, 160) : null,
        message: sanitizeInquiryText(input.message, 5000),
        website: input.website ?? '',
      },
    },
  )

  if (error) {
    const context = error as { context?: { status?: number } }
    const status =
      typeof context.context?.status === 'number'
        ? context.context.status
        : undefined
    throw mapInvokeFailure(status, data ?? null)
  }

  if (!data?.ok) {
    throw mapInvokeFailure(undefined, data ?? null)
  }

  return {
    ok: true,
    inquiry: null,
    suppressed: Boolean(data.suppressed),
    message: data.message?.trim() || successMessage,
  }
}
