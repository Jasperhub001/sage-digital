import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { contactConfig } from '../config/contact'
import { submitContactInquiry } from '../services/contactService'
import { getPublishedServices } from '../services/serviceService'
import type { Service } from '../types/service'
import './ContactForm.css'

interface FormFields {
  name: string
  email: string
  service: string
  details: string
  /** Honeypot — must remain empty. */
  website: string
}

interface FormErrors {
  name?: string
  email?: string
  service?: string
  details?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const INITIAL_FIELDS: FormFields = {
  name: '',
  email: '',
  service: '',
  details: '',
  website: '',
}

function validate(fields: FormFields): FormErrors {
  const errors: FormErrors = {}

  if (!fields.name.trim()) {
    errors.name = 'Please enter your name.'
  } else if (fields.name.trim().length < 2) {
    errors.name = 'Name should be at least 2 characters.'
  } else if (fields.name.trim().length > 120) {
    errors.name = 'Name is too long.'
  }

  if (!fields.email.trim()) {
    errors.email = 'Please enter your email address.'
  } else if (!EMAIL_PATTERN.test(fields.email.trim())) {
    errors.email = 'Please enter a valid email address.'
  } else if (fields.email.trim().length > 254) {
    errors.email = 'Email is too long.'
  }

  if (!fields.service) {
    errors.service = 'Please select a service of interest.'
  } else if (fields.service.length > 160) {
    errors.service = 'Selection is too long.'
  }

  if (!fields.details.trim()) {
    errors.details = 'Please share a few project details.'
  } else if (fields.details.trim().length < 20) {
    errors.details = 'Add a little more detail (at least 20 characters).'
  } else if (fields.details.trim().length > 5000) {
    errors.details = 'Message is too long (max 5000 characters).'
  }

  return errors
}

function ContactForm() {
  const formId = useId()
  const submittingRef = useRef(false)
  const [fields, setFields] = useState<FormFields>(INITIAL_FIELDS)
  const [errors, setErrors] = useState<FormErrors>({})
  const [services, setServices] = useState<Service[]>([])
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>(
    'idle',
  )
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void getPublishedServices()
      .then((list) => {
        if (!cancelled) setServices(list)
      })
      .catch(() => {
        if (!cancelled) {
          setServices([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const updateField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
    setFields((current) => ({ ...current, [key]: value }))
    if (key !== 'website') {
      setErrors((current) => {
        const fieldKey = key as keyof FormErrors
        if (!current[fieldKey]) return current
        const next = { ...current }
        delete next[fieldKey]
        return next
      })
    }
    if (status === 'success' || status === 'error') {
      setStatus('idle')
      setFeedback(null)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submittingRef.current || status === 'submitting') return

    const nextErrors = validate(fields)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setStatus('error')
      setFeedback(contactConfig.form.errorMessage)

      const order: Array<keyof FormFields> = [
        'name',
        'email',
        'service',
        'details',
      ]
      const firstInvalid = order.find((key) => nextErrors[key as keyof FormErrors])
      if (firstInvalid) {
        window.requestAnimationFrame(() => {
          document.getElementById(`${formId}-${firstInvalid}`)?.focus()
        })
      }
      return
    }

    submittingRef.current = true
    setStatus('submitting')
    setFeedback(null)

    try {
      const result = await submitContactInquiry({
        name: fields.name.trim(),
        email: fields.email.trim(),
        service: fields.service,
        details: fields.details.trim(),
        website: fields.website,
      })
      setStatus('success')
      setFeedback(result.message)
      setFields(INITIAL_FIELDS)
    } catch (caught) {
      setStatus('error')
      setFeedback(
        caught instanceof Error && caught.message.trim()
          ? caught.message
          : 'Something went wrong while sending your enquiry. Please try email instead.',
      )
    } finally {
      submittingRef.current = false
    }
  }

  const nameId = `${formId}-name`
  const emailId = `${formId}-email`
  const serviceId = `${formId}-service`
  const detailsId = `${formId}-details`
  const websiteId = `${formId}-website`
  const feedbackId = `${formId}-feedback`

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="contact-form__grid">
        <div className="contact-form__field">
          <label className="contact-form__label" htmlFor={nameId}>
            Name <span aria-hidden="true">*</span>
          </label>
          <input
            id={nameId}
            className={`contact-form__input${errors.name ? ' is-invalid' : ''}`}
            name="name"
            type="text"
            autoComplete="name"
            maxLength={120}
            value={fields.name}
            onChange={(event) => updateField('name', event.target.value)}
            aria-required="true"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${nameId}-error` : undefined}
            disabled={status === 'submitting'}
          />
          {errors.name ? (
            <p id={`${nameId}-error`} className="contact-form__error" role="alert">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="contact-form__field">
          <label className="contact-form__label" htmlFor={emailId}>
            Email <span aria-hidden="true">*</span>
          </label>
          <input
            id={emailId}
            className={`contact-form__input${errors.email ? ' is-invalid' : ''}`}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            value={fields.email}
            onChange={(event) => updateField('email', event.target.value)}
            aria-required="true"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${emailId}-error` : undefined}
            disabled={status === 'submitting'}
          />
          {errors.email ? (
            <p id={`${emailId}-error`} className="contact-form__error" role="alert">
              {errors.email}
            </p>
          ) : null}
        </div>
      </div>

      {/* Honeypot: hidden from users; bots that fill it are suppressed server-side. */}
      <div className="contact-form__hp" aria-hidden="true">
        <label htmlFor={websiteId}>Website</label>
        <input
          id={websiteId}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={fields.website}
          onChange={(event) => updateField('website', event.target.value)}
        />
      </div>

      <div className="contact-form__field">
        <label className="contact-form__label" htmlFor={serviceId}>
          Service of interest <span aria-hidden="true">*</span>
        </label>
        <select
          id={serviceId}
          className={`contact-form__input contact-form__select${errors.service ? ' is-invalid' : ''}`}
          name="service"
          value={fields.service}
          onChange={(event) => updateField('service', event.target.value)}
          aria-required="true"
          aria-invalid={Boolean(errors.service)}
          aria-describedby={errors.service ? `${serviceId}-error` : undefined}
          disabled={status === 'submitting'}
        >
          <option value="">Select a service</option>
          {services.map((service) => (
            <option key={service.id} value={service.title}>
              {service.title}
            </option>
          ))}
          <option value="Not sure yet">Not sure yet</option>
        </select>
        {errors.service ? (
          <p id={`${serviceId}-error`} className="contact-form__error" role="alert">
            {errors.service}
          </p>
        ) : null}
      </div>

      <div className="contact-form__field">
        <label className="contact-form__label" htmlFor={detailsId}>
          Project details <span aria-hidden="true">*</span>
        </label>
        <textarea
          id={detailsId}
          className={`contact-form__input contact-form__textarea${errors.details ? ' is-invalid' : ''}`}
          name="details"
          rows={5}
          maxLength={5000}
          value={fields.details}
          onChange={(event) => updateField('details', event.target.value)}
          aria-required="true"
          aria-invalid={Boolean(errors.details)}
          aria-describedby={errors.details ? `${detailsId}-error` : undefined}
          placeholder="Goals, timeline, references, or anything that helps us understand the work."
          disabled={status === 'submitting'}
        />
        {errors.details ? (
          <p id={`${detailsId}-error`} className="contact-form__error" role="alert">
            {errors.details}
          </p>
        ) : null}
      </div>

      <div className="contact-form__actions">
        <button
          type="submit"
          className="contact-form__submit"
          disabled={status === 'submitting'}
        >
          {status === 'submitting' ? 'Sending…' : 'Send enquiry'}
        </button>
        <p className="contact-form__note">
          Submissions are stored securely. We typically reply within a few
          business days.
        </p>
      </div>

      {feedback ? (
        <p
          id={feedbackId}
          className={`contact-form__feedback contact-form__feedback--${status}`}
          role="status"
          aria-live="polite"
        >
          {feedback}
        </p>
      ) : null}
    </form>
  )
}

export default ContactForm
