import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProjectBySlug } from '../services/projectService'
import type { Project } from '../types/project'
import './ProjectDetailPage.css'

function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>(
    'loading',
  )

  useEffect(() => {
    let cancelled = false

    async function loadProject() {
      if (!slug) {
        setStatus('missing')
        return
      }

      setStatus('loading')

      try {
        const result = await getProjectBySlug(slug)
        if (cancelled) return

        if (!result) {
          setProject(null)
          setStatus('missing')
          return
        }

        setProject(result)
        setStatus('ready')
      } catch {
        if (!cancelled) {
          setProject(null)
          setStatus('error')
        }
      }
    }

    void loadProject()
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  useEffect(() => {
    const previousTitle = document.title

    if (status === 'ready' && project) {
      document.title = `${project.title} — SÅGÊ Digital`
    } else if (status === 'missing' || status === 'error') {
      document.title = 'Project — SÅGÊ Digital'
    }

    return () => {
      document.title = previousTitle
    }
  }, [status, project])

  if (status === 'loading') {
    return (
      <div className="project-detail project-detail--state">
        <p>Loading project…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="project-detail project-detail--state">
        <p>Something went wrong while loading this project.</p>
        <Link className="project-detail__back" to="/#work">
          Back to work
        </Link>
      </div>
    )
  }

  if (status === 'missing' || !project) {
    return (
      <div className="project-detail project-detail--state">
        <p>This project is unavailable or not published.</p>
        <Link className="project-detail__back" to="/#work">
          Back to work
        </Link>
      </div>
    )
  }

  return (
    <article className="project-detail" aria-labelledby="project-title">
      <div className="project-detail__inner">
        <Link className="project-detail__back" to="/#work">
          Back to work
        </Link>

        <header className="project-detail__header">
          <p className="project-detail__category">{project.category}</p>
          <h1 id="project-title" className="project-detail__title">
            {project.title}
          </h1>
          <p className="project-detail__description">{project.description}</p>

          <ul className="project-detail__tech" aria-label="Technologies used">
            {project.technologies.map((tech) => (
              <li key={tech}>{tech}</li>
            ))}
          </ul>

          <div className="project-detail__actions">
            {project.liveUrl ? (
              <a
                className="project-detail__cta project-detail__cta--primary"
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
              >
                View live site
              </a>
            ) : null}
            {project.githubUrl ? (
              <a
                className="project-detail__cta project-detail__cta--ghost"
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
              >
                View code
              </a>
            ) : null}
          </div>
        </header>

        <figure className="project-detail__cover">
          <img
            src={project.coverImage}
            alt={`${project.title} cover`}
            width={1200}
            height={750}
            decoding="async"
          />
          <figcaption className="project-detail__caption">
            Placeholder imagery — real screenshots will replace this when
            available.
          </figcaption>
        </figure>

        {project.gallery.length > 0 ? (
          <section
            className="project-detail__gallery"
            aria-label={`${project.title} gallery`}
          >
            {project.gallery.map((image, index) => (
              <figure key={image} className="project-detail__gallery-item">
                <img
                  src={image}
                  alt={`${project.title} placeholder screenshot ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  width={1200}
                  height={750}
                />
                <figcaption className="project-detail__caption">
                  Placeholder imagery
                </figcaption>
              </figure>
            ))}
          </section>
        ) : null}
      </div>
    </article>
  )
}

export default ProjectDetailPage
