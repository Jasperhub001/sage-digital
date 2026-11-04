import { useEffect, useState } from 'react'
import { getPublishedServices } from '../services/serviceService'
import type { Service } from '../types/service'
import './Services.css'

function Services() {
  const [services, setServices] = useState<Service[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadServices() {
      try {
        const published = await getPublishedServices()
        if (!cancelled) setServices(published)
      } catch {
        if (!cancelled) setError('Unable to load services right now.')
      }
    }

    void loadServices()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section id="services" className="services" aria-labelledby="services-heading">
      <div className="services__inner">
        <header className="services__header">
          <p className="services__eyebrow">Capabilities</p>
          <h2 id="services-heading" className="services__title">
            What we build.
          </h2>
          <p className="services__intro">
            Focused offerings for businesses that want digital work with
            presence, precision and lasting impact.
          </p>
        </header>

        {error ? (
          <p className="services__status" role="alert">
            {error}
          </p>
        ) : null}

        <ul className="services__list">
          {services.map((service, index) => (
            <li key={service.id} className="services__item">
              <span className="services__index" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="services__content">
                {service.iconUrl ? (
                  <img
                    className="services__icon"
                    src={service.iconUrl}
                    alt=""
                    width={28}
                    height={28}
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}
                <h3 className="services__name">{service.title}</h3>
                <p className="services__copy">{service.description}</p>
                {service.features.length > 0 ? (
                  <ul className="services__features">
                    {service.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Services
