import { useEffect, useState, useTransition } from 'react'
import { useRevealOnScroll } from '../hooks/useRevealOnScroll'
import {
  getCategoryFilters,
  getProjectsByCategory,
} from '../services/projectService'
import type { Project, ProjectCategoryFilter } from '../types/project'
import ProjectCard from './ProjectCard'
import './ProjectShowcase.css'

function ProjectShowcase() {
  const sectionRef = useRevealOnScroll<HTMLElement>()
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<ProjectCategoryFilter[]>(['All'])
  const [activeCategory, setActiveCategory] =
    useState<ProjectCategoryFilter>('All')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadMeta() {
      try {
        const [filterList, initialProjects] = await Promise.all([
          getCategoryFilters(),
          getProjectsByCategory('All'),
        ])
        if (cancelled) return
        setCategories([...filterList])
        setProjects(initialProjects)
      } catch {
        if (!cancelled) {
          setError('Unable to load projects right now.')
        }
      } finally {
        if (!cancelled) setHasLoaded(true)
      }
    }

    void loadMeta()
    return () => {
      cancelled = true
    }
  }, [])

  const handleFilter = (category: ProjectCategoryFilter) => {
    setActiveCategory(category)
    startTransition(() => {
      void getProjectsByCategory(category)
        .then((filtered) => {
          setProjects(filtered)
          setError(null)
        })
        .catch(() => setError('Unable to filter projects right now.'))
    })
  }

  const showEmpty = hasLoaded && !error && projects.length === 0

  return (
    <section
      id="work"
      ref={sectionRef}
      className="showcase reveal"
      aria-labelledby="work-heading"
    >
      <div className="showcase__inner">
        <header className="showcase__header">
          <p className="showcase__eyebrow">Selected work</p>
          <h2 id="work-heading" className="showcase__title">
            Projects built to move brands forward.
          </h2>
          <p className="showcase__intro">
            Published work across websites, landing pages, AI integrations and
            automation — growing as new projects ship.
          </p>
        </header>

        <div
          className="showcase__filters"
          role="group"
          aria-label="Filter projects by category"
        >
          {categories.map((category) => {
            const isActive = category === activeCategory
            return (
              <button
                key={category}
                type="button"
                className={`showcase__filter${isActive ? ' is-active' : ''}`}
                aria-pressed={isActive}
                onClick={() => handleFilter(category)}
              >
                {category}
              </button>
            )
          })}
        </div>

        {error ? (
          <p className="showcase__status" role="alert">
            {error}
          </p>
        ) : null}

        <div
          className={`showcase__grid${isPending ? ' is-pending' : ''}`}
          aria-busy={isPending}
        >
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}

          {showEmpty ? (
            <div className="showcase__empty" role="status">
              <p className="showcase__empty-eyebrow">Nothing here yet</p>
              <p className="showcase__empty-title">
                {activeCategory === 'All'
                  ? 'No published projects yet.'
                  : `No published projects in ${activeCategory.toLowerCase()}.`}
              </p>
              <p className="showcase__empty-copy">
                {activeCategory === 'All'
                  ? 'Published work will appear here as projects ship.'
                  : 'This category is ready for upcoming work. Browse All to see currently published projects, or check back soon.'}
              </p>
              {activeCategory !== 'All' ? (
                <button
                  type="button"
                  className="showcase__empty-action"
                  onClick={() => handleFilter('All')}
                >
                  View all projects
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default ProjectShowcase
