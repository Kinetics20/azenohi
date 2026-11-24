import { HeroScene } from '../components/scene/HeroScene';
import { PageTitle } from '../components/layout/PageTitle';
export function Home() {
  return (
    <section className="home-page">
      <HeroScene />
      <div className="home-copy">
        <PageTitle eyebrow="AZENO HI">
          Hybrid
          <br />
          <em>In</em>telligence
        </PageTitle>
      </div>
      <div className="ribbon ribbon-left" aria-hidden="true" />
      <div className="ribbon ribbon-right" aria-hidden="true" />
    </section>
  );
}
