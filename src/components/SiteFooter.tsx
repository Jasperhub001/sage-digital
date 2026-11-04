import { Link } from 'react-router-dom'
import {
  formatCopyrightText,
  splitBrandName,
} from '../config/siteDefaults'
import { useSiteSettings } from '../hooks/useSiteSettings'
import './SiteFooter.css'

const FOOTER_NAV = [
  { to: '/#home', label: 'Home' },
  { to: '/#services', label: 'Services' },
  { to: '/#work', label: 'Work' },
  { to: '/#about', label: 'About' },
  { to: '/#contact', label: 'Contact' },
] as const

function SiteFooter() {
  const { settings, socialLinks } = useSiteSettings()
  const brand = splitBrandName(settings.brandName)
  const copyright = formatCopyrightText(
    settings.copyrightText,
    settings.brandName,
  )

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand-block">
          <Link className="site-footer__brand" to="/#home">
            {brand.accent ? (
              <>
                {brand.primary} <span>{brand.accent}</span>
              </>
            ) : (
              brand.primary
            )}
          </Link>
          <p className="site-footer__tagline">{settings.footerDescription}</p>
        </div>

        <nav className="site-footer__nav" aria-label="Footer">
          <p className="site-footer__heading">Navigate</p>
          <ul className="site-footer__list">
            {FOOTER_NAV.map((item) => (
              <li key={item.to}>
                <Link className="site-footer__link" to={item.to}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-footer__contact">
          <p className="site-footer__heading">Contact</p>
          {settings.showContactEmail ? (
            <a
              className="site-footer__link"
              href={`mailto:${settings.contactEmail}`}
            >
              {settings.contactEmail}
            </a>
          ) : null}
          {settings.location?.trim() ? (
            <p className="site-footer__muted">{settings.location.trim()}</p>
          ) : null}
          {socialLinks.length > 0 ? (
            <ul className="site-footer__social" aria-label="Social links">
              {socialLinks.map((link) => (
                <li key={link.id}>
                  <a
                    className="site-footer__link"
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="site-footer__bar">
        <p>{copyright}</p>
      </div>
    </footer>
  )
}

export default SiteFooter
