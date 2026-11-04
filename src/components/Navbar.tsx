import { useEffect, useId, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { splitBrandName } from '../config/siteDefaults'
import { useSiteSettings } from '../hooks/useSiteSettings'
import './Navbar.css'

const NAV_OVERLAY_QUERY = '(max-width: 860px)'

const NAV_LINKS = [
  { to: '/#home', hash: '#home', label: 'Home' },
  { to: '/#services', hash: '#services', label: 'Services' },
  { to: '/#work', hash: '#work', label: 'Work' },
  { to: '/#about', hash: '#about', label: 'About' },
] as const

function isSectionActive(pathname: string, hash: string, targetHash: string) {
  if (pathname !== '/') return false
  const current = hash || '#home'
  return current === targetHash
}

function Navbar() {
  const { settings } = useSiteSettings()
  const brand = splitBrandName(settings.brandName)
  const [isScrolled, setIsScrolled] = useState(false)
  const [openForLocation, setOpenForLocation] = useState<string | null>(null)
  const menuId = useId()
  const location = useLocation()
  const [isOverlayNav, setIsOverlayNav] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(NAV_OVERLAY_QUERY).matches
  })
  const locationKey = `${location.pathname}${location.hash}`
  const isOpen = openForLocation === locationKey
  // Overlay nav starts closed; keep it out of the tab order until opened.
  const menuInert = isOverlayNav && !isOpen

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 24)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const media = window.matchMedia(NAV_OVERLAY_QUERY)
    const onChange = () => setIsOverlayNav(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenForLocation(null)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  const closeMenu = () => setOpenForLocation(null)

  return (
    <header
      className={`navbar${isScrolled || isOpen ? ' navbar--scrolled' : ''}${isOpen ? ' navbar--menu-open' : ''}`}
    >
      <div className="navbar__inner">
        <Link className="navbar__brand" to="/#home" onClick={closeMenu}>
          <span className="navbar__brand-mark" aria-hidden="true" />
          <span className="navbar__brand-text">
            {brand.accent ? (
              <>
                {brand.primary}{' '}
                <span className="navbar__brand-accent">{brand.accent}</span>
              </>
            ) : (
              brand.primary
            )}
          </span>
        </Link>

        <button
          type="button"
          className={`navbar__toggle${isOpen ? ' is-open' : ''}`}
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          onClick={() =>
            setOpenForLocation((current) =>
              current === locationKey ? null : locationKey,
            )
          }
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>

        <nav
          id={menuId}
          className={`navbar__nav${isOpen ? ' is-open' : ''}`}
          aria-label="Primary"
          {...(menuInert ? { inert: true } : {})}
        >
          <ul className="navbar__list">
            {NAV_LINKS.map((link) => {
              const active = isSectionActive(
                location.pathname,
                location.hash,
                link.hash,
              )
              return (
                <li key={link.to}>
                  <Link
                    className={`navbar__link${active ? ' is-active' : ''}`}
                    to={link.to}
                    aria-current={active ? 'page' : undefined}
                    onClick={closeMenu}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <Link className="navbar__cta" to="/#contact" onClick={closeMenu}>
            Contact
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Navbar
