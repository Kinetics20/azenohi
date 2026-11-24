import { ArrowLeft, Cloud, CodeXml, Hexagon, Zap } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/layout/Icon';
import { capabilities, projects } from '../data/content';
function BackToProjects({ slug }: { slug: string }) {
  return (
    <Link className="back-link" to={`/projects#project-${slug}`}>
      <ArrowLeft aria-hidden="true" />
      Back to projects
    </Link>
  );
}
export function NotFound() {
  return (
    <section className="not-found">
      <p className="eyebrow">OFF THE MAP</p>
      <h1>
        Space is vast.
        <br />
        This page is missing.
      </h1>
      <Link className="text-link" to="/">
        Return to Home
      </Link>
    </section>
  );
}
export function ProjectDetail() {
  const { slug } = useParams();
  const project = projects.find((item) => item.slug === slug);
  if (!project) return <NotFound />;
  if (project.slug !== 'risk-miner')
    return (
      <section className="inner-page generic-detail">
        <BackToProjects slug={project.slug} />
        <div className="generic-layout">
          <div>
            <p className="eyebrow">
              {project.event} · {project.year}
            </p>
            <h1>{project.title}</h1>
            <p className="project-subtitle">{project.description}</p>
            {project.award && <span className="award">{project.award}</span>}
          </div>
          <figure className="project-visual">
            <img
              src={`/images/projects/${project.slug}.webp`}
              alt={`${project.title} concept illustration`}
            />
            <figcaption className="detail-note">
              Project overview from the AzenoHI portfolio concept.
            </figcaption>
          </figure>
        </div>
        <div className="project-return">
          <BackToProjects slug={project.slug} />
        </div>
      </section>
    );
  return (
    <section className="inner-page risk-page">
      <BackToProjects slug={project.slug} />
      <div className="risk-hero">
        <div className="risk-heading">
          <h1>
            <em>/</em> Risk Miner
          </h1>
          <p className="project-subtitle">{project.description}</p>
          <div className="risk-event">
            <span className="award">HackNation</span>
            <time>2026</time>
          </div>
        </div>
        <img
          className="risk-illustration"
          src="/images/projects/risk-miner.webp"
          alt="Concept illustration: a construction site on a map of Poland linked to risk analysis panels"
          width="900"
          height="720"
        />
      </div>
      <div className="risk-lower">
        <div>
          <div className="capabilities">
            {capabilities.map((item) => (
              <div className="capability" key={item.title}>
                <Icon name={item.icon} />
                <div>
                  <h2>{item.title}</h2>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="risk-screens">
            {[
              { name: 'detect', label: 'Geographic risk overview' },
              { name: 'analyse', label: 'Investment portfolio overview' },
              { name: 'predict', label: 'Risk forecast concept' },
            ].map((item) => (
              <figure key={item.name}>
                <img
                  src={`/images/risk-miner/${item.name}.webp`}
                  alt={item.label}
                  width="368"
                  height="211"
                />
                <figcaption>{item.label}</figcaption>
              </figure>
            ))}
          </div>
          <p className="concept-note">Concept visuals · illustrative project views</p>
        </div>
        <aside className="risk-aside">
          <section aria-labelledby="project-technology">
            <h2 className="section-label" id="project-technology">
              TECHNOLOGY
              <span />
            </h2>
            <ul className="technology-list">
              {[
                { name: 'Python', Icon: CodeXml },
                { name: 'FastAPI', Icon: Zap },
                { name: 'Kubernetes', Icon: Hexagon },
                { name: 'GCP', Icon: Cloud },
              ].map((item) => (
                <li key={item.name}>
                  <item.Icon aria-hidden="true" />
                  <span>{item.name}</span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="project-team">
            <h2 className="section-label" id="project-team">
              TEAM — AzenoHI
              <span />
            </h2>
            <div className="team-avatars">
              {[1, 2, 3, 4].map((portrait) => (
                <img
                  key={portrait}
                  src={`/images/risk-miner/team-${portrait}.webp`}
                  alt="Project team portrait from concept"
                />
              ))}
              <span>+1</span>
            </div>
          </section>
          <p className="aside-note">Team and technology shown in the project concept.</p>
        </aside>
      </div>
      <div className="project-return">
        <BackToProjects slug={project.slug} />
      </div>
    </section>
  );
}
