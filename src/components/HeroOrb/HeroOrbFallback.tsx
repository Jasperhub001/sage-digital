import './HeroOrb.css'

function HeroOrbFallback() {
  return (
    <div className="hero-orb__fallback" aria-hidden="true">
      <div className="hero-orb__fallback-stage">
        <span className="hero-orb__fallback-ring hero-orb__fallback-ring--a" />
        <span className="hero-orb__fallback-ring hero-orb__fallback-ring--b" />
        <div className="hero-orb__fallback-sphere">
          <span className="hero-orb__fallback-sheen" />
          <span className="hero-orb__fallback-core" />
        </div>
      </div>
    </div>
  )
}

export default HeroOrbFallback
