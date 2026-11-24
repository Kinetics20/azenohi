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
    </section>
  );
}
