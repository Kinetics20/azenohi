import { ArrowUpRight, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageTitle } from '../components/layout/PageTitle';
import { projects } from '../data/content';
export function Projects() {
  return (
    <section className="inner-page projects-page">
      <PageTitle eyebrow="OUR PROJECTS">
        From Hackathons
        <br />
        to <em>Real Impact</em>
      </PageTitle>
      <div className="projects-grid">
        {projects.map((project) => (
          <Link
            className={`project-card project-${project.slug}`}
            to={`/projects/${project.slug}`}
            key={project.slug}
          >
            <div className="project-body">
              <img src={`/images/projects/${project.slug}.webp`} alt="" width="300" height="230" />
              <div className="project-copy">
                {project.award && (
                  <span className={`award ${project.award === '3rd Place' ? 'bronze' : ''}`}>
                    <Trophy aria-hidden="true" />
                    {project.award}
                  </span>
                )}
                <h2>{project.title}</h2>
                <p>{project.description}</p>
              </div>
            </div>
            <div className="project-footer">
              <span className="event-symbol" aria-hidden="true">
                {project.symbol}
              </span>
              <span>{project.event}</span>
              <time>{project.year}</time>
              <ArrowUpRight aria-hidden="true" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
