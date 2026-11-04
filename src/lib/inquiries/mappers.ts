import type { InquiryInsert, InquiryRow } from '../../types/database'
import type { Inquiry } from '../../types/inquiry'

export function mapInquiryRow(row: InquiryRow): Inquiry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function stripUnsafeControls(value: string): string {
  let output = ''
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    // Allow TAB (9), LF (10), CR (13); drop other C0 controls and DEL.
    if (code === 9 || code === 10 || code === 13) {
      output += value[index]
      continue
    }
    if (code <= 8 || (code >= 11 && code <= 12) || (code >= 14 && code <= 31) || code === 127) {
      continue
    }
    output += value[index]
  }
  return output
}

export function sanitizeInquiryText(value: string, max: number): string {
  return stripUnsafeControls(value).trim().slice(0, max)
}

export function toInquiryInsert(input: {
  name: string
  email: string
  phone?: string | null
  subject?: string | null
  message: string
}): InquiryInsert {
  const phone = input.phone?.trim()
  const subject = input.subject?.trim()

  return {
    name: sanitizeInquiryText(input.name, 120),
    email: sanitizeInquiryText(input.email, 254).toLowerCase(),
    phone: phone ? sanitizeInquiryText(phone, 40) : null,
    subject: subject ? sanitizeInquiryText(subject, 160) : null,
    message: sanitizeInquiryText(input.message, 5000),
    status: 'new',
  }
}
