import { Link } from 'react-router-dom'
import { useSiteSettings } from '../hooks/useSiteSettings'
import HeroOrb from './HeroOrb/HeroOrb'
import './Hero.css'

function Hero() {
  const { settings } = useSiteSettings()

  return (
    <section id="home" className="hero" aria-labelledby="hero-heading">
      <div className="hero__atmosphere" aria-hidden="true">
        <div className="hero__glow hero__glow--primary" />
        <div className="hero__glow hero__glow--secondary" />
        <div className="hero__grain" />
        <div className="hero__line" />
      </div>

      <HeroOrb />

      <div className="hero__content">
        <p className="hero__brand">{settings.brandName}</p>

        <h1 id="hero-heading" className="hero__headline">
          {settings.heroHeading}
        </h1>

        <p className="hero__intro">{settings.heroSupportingText}</p>

        <div className="hero__actions">
          <Link className="hero__cta hero__cta--primary" to="/#contact">
            Start a Project
          </Link>
          <Link className="hero__cta hero__cta--ghost" to="/#work">
            View Our Work
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Hero
