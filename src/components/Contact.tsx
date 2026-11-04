import { getWhatsAppUrl } from '../config/contact'
import { useSiteSettings } from '../hooks/useSiteSettings'
import ContactForm from './ContactForm'
import './Contact.css'

function Contact() {
  const { settings } = useSiteSettings()
  const whatsappUrl =
    settings.showWhatsapp && settings.whatsappNumber
      ? getWhatsAppUrl(settings.whatsappNumber, settings.brandName)
      : null
  const showEmail = settings.showContactEmail
  const mailHref = `mailto:${settings.contactEmail}?subject=${encodeURIComponent(
    `Project enquiry — ${settings.brandName}`,
  )}`

  return (
    <section id="contact" className="contact" aria-labelledby="contact-heading">
      <div className="contact__inner">
        <header className="contact__header">
          <p className="contact__eyebrow">Start a conversation</p>
          <h2 id="contact-heading" className="contact__title">
            Let’s discuss your next digital move.
          </h2>
          <p className="contact__copy">
            Whether you need a website, a high-converting landing page, an AI
            integration, or business automation — share a few details and we’ll
            respond with a clear next step.
          </p>
        </header>

        <div className="contact__layout">
          <div className="contact__form-panel">
            <ContactForm />
          </div>

          <aside className="contact__aside" aria-label="Direct contact">
            <p className="contact__aside-eyebrow">Prefer direct contact?</p>
            <p className="contact__aside-copy">
              Reach out
              {showEmail && whatsappUrl
                ? ' by email or WhatsApp'
                : showEmail
                  ? ' by email'
                  : whatsappUrl
                    ? ' on WhatsApp'
                    : ' through the form'}{' '}
              and we’ll get back to you promptly.
            </p>

            <div className="contact__channels">
              {showEmail ? (
                <a
                  className="contact__channel contact__channel--primary"
                  href={mailHref}
                >
                  <span className="contact__channel-label">Email</span>
                  <span className="contact__channel-value">
                    {settings.contactEmail}
                  </span>
                </a>
              ) : null}

              {settings.showWhatsapp ? (
                whatsappUrl ? (
                  <a
                    className="contact__channel"
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="contact__channel-label">WhatsApp</span>
                    <span className="contact__channel-value">
                      Message on WhatsApp
                    </span>
                  </a>
                ) : (
                  <div className="contact__channel contact__channel--pending">
                    <span className="contact__channel-label">WhatsApp</span>
                    <span className="contact__channel-value">
                      Coming soon
                      {showEmail ? '. Email is available now.' : '.'}
                    </span>
                  </div>
                )
              ) : null}

              {settings.location?.trim() ? (
                <div className="contact__channel contact__channel--pending">
                  <span className="contact__channel-label">Location</span>
                  <span className="contact__channel-value">
                    {settings.location.trim()}
                  </span>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

export default Contact
