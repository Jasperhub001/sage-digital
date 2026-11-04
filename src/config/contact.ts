/**
 * Contact form delivery configuration (not admin-editable).
 * Public email / WhatsApp / socials come from site settings + defaults.
 */

export const contactConfig = {
  form: {
    /**
     * Public submissions go through the `submit-inquiry` Edge Function
     * (server validation + rate limits). Direct anon INSERT is revoked.
     */
    deliveryMode: 'edge-function' as const,
    successMessage:
      'Thank you — your enquiry has been received. We will get back to you soon.',
    errorMessage: 'Please correct the highlighted fields and try again.',
  },
} as const

export function getWhatsAppUrl(
  number: string | null | undefined,
  brandName = 'SÅGÊ Digital',
): string | null {
  if (!number) return null
  const digits = number.replace(/\D/g, '')
  if (!digits) return null
  const text = encodeURIComponent(
    `Hello ${brandName} — I’d like to discuss a project.`,
  )
  return `https://wa.me/${digits}?text=${text}`
}
