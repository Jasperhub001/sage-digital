import { Link } from 'react-router-dom'
import type { Project } from '../types/project'
import './ProjectCard.css'

interface ProjectCardProps {
  project: Project
}

function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="project-card">
      <Link
        className="project-card__link"
        to={`/work/${project.slug}`}
        aria-label={`View project: ${project.title}`}
      >
        <div className="project-card__media">
          <img
            className="project-card__image"
            src={project.coverImage}
            alt=""
            loading="lazy"
            decoding="async"
            width={1200}
            height={750}
          />
          {project.featured ? (
            <span className="project-card__badge">Featured</span>
          ) : null}
        </div>

        <div className="project-card__body">
          <p className="project-card__category">{project.category}</p>
          <h3 className="project-card__title">{project.title}</h3>
          <p className="project-card__excerpt">{project.description}</p>
          <span className="project-card__cta">View project</span>
        </div>
      </Link>
    </article>
  )
}

export default ProjectCard
