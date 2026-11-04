import { useSiteSettings } from '../hooks/useSiteSettings'
import './About.css'

function About() {
  const { settings } = useSiteSettings()

  return (
    <section id="about" className="about" aria-labelledby="about-heading">
      <div className="about__inner">
        <p className="about__eyebrow">About</p>
        <h2 id="about-heading" className="about__title">
          A digital studio for brands that value craft.
        </h2>
        <p className="about__copy">{settings.businessDescription}</p>
      </div>
    </section>
  )
}

export default About
