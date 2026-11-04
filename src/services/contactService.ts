import { contactConfig } from '../config/contact'
import { createPublicInquiry } from './inquiryService'

export interface ContactInquiry {
  name: string
  email: string
  service: string
  details: string
  /** Honeypot — leave empty. */
  website?: string
}

export interface ContactSubmissionResult {
  ok: boolean
  mode: 'edge-function'
  message: string
}

/**
 * Public contact submission entry point.
 * Maps the form fields onto the inquiry intake (service → subject, details → message).
 */
export async function submitContactInquiry(
  inquiry: ContactInquiry,
): Promise<ContactSubmissionResult> {
  if (contactConfig.form.deliveryMode !== 'edge-function') {
    throw new Error('Unsupported contact delivery mode.')
  }

  const result = await createPublicInquiry(
    {
      name: inquiry.name,
      email: inquiry.email,
      subject: inquiry.service,
      message: inquiry.details,
      phone: null,
      website: inquiry.website,
    },
    contactConfig.form.successMessage,
  )

  return {
    ok: result.ok,
    mode: 'edge-function',
    message: result.message,
  }
}
