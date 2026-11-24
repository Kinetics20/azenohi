import type { CSSProperties } from 'react';
import { PageTitle } from '../components/layout/PageTitle';
import { milestones } from '../data/content';
function timelineStyle(step: number): CSSProperties & { '--step': number } {
  return { '--step': step };
}
export function Journey() {
  return (
    <section className="journey-page">
      <div className="journey-heading">
        <PageTitle eyebrow="OUR JOURNEY">
          Small Steps.
          <br />
          Big <em>Dreams.</em>
        </PageTitle>
        <p>
          From a home office to global hackathons.
          <br />
          The journey continues...
        </p>
      </div>
      <svg
        className="journey-path"
        viewBox="0 0 1672 941"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <filter id="path-glow">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <path
          className="path-glow"
          d="M-30 790 C50 740 80 730 150 730 S300 695 390 685 S510 670 608 655 S770 630 850 620 S1000 580 1084 578 S1180 570 1217 540 S1270 500 1298 478 S1430 430 1346 396 S1410 353 1458 304 S1360 262 1410 231"
        />
        <path d="M-30 790 C50 740 80 730 150 730 S300 695 390 685 S510 670 608 655 S770 630 850 620 S1000 580 1084 578 S1180 570 1217 540 S1270 500 1298 478 S1430 430 1346 396 S1410 353 1458 304 S1360 262 1410 231" />
      </svg>
      <ol className="milestones">
        {milestones.map((milestone, index) => (
          <li key={milestone.year} style={timelineStyle(index)}>
            <img
              src={`/images/journey/${milestone.year}.webp`}
              alt={`Illustration for the ${milestone.year} milestone`}
              width="174"
              height="108"
            />
            <span className="milestone-dot" aria-hidden="true" />
            <div>
              <h2>
                <time>{milestone.year}</time>
              </h2>
              <p>{milestone.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="journey-future">
        THE BEST
        <br />
        IS YET TO COME
        <span />
      </p>
      <div className="journey-signature" aria-hidden="true">
        <i />
        AzenoHI
      </div>
    </section>
  );
}
