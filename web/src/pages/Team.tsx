import { PageTitle } from '../components/layout/PageTitle';
import { Icon } from '../components/layout/Icon';
import { teamMembers } from '../data/content';
export function Team() {
  return (
    <section className="inner-page team-page">
      <PageTitle eyebrow="OUR TEAM">
        People <em>×</em> AI
      </PageTitle>
      <div className="team-grid">
        {teamMembers.map((person, index) => (
          <article
            key={person.slug}
            className={`person-card ${index === 0 ? 'person-featured' : ''}`}
          >
            <img src={`/images/team/${person.slug}.webp`} alt="" width="218" height="176" />
            <div className="person-label">
              <h2>{person.name}</h2>
              <Icon name={person.icon} />
            </div>
          </article>
        ))}
        <div className="team-count">
          <span aria-hidden="true">+</span>
          <strong>14+</strong>
          <p>team members</p>
        </div>
      </div>
    </section>
  );
}
