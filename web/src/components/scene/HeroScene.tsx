import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Pause, Play } from 'lucide-react';
import { shouldAnimate, supportsWebGL } from './motion';
const SpaceCanvas = lazy(() => import('./SpaceCanvas'));
export class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export function HeroScene() {
  const host = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [available] = useState(supportsWebGL);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const [intersecting, setIntersecting] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => setFailed(true), []);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(preference.matches);
    const visibility = () => setVisible(!document.hidden);
    const observer = new IntersectionObserver((entries) =>
      setIntersecting(entries[0]?.isIntersecting ?? false),
    );
    if (host.current) observer.observe(host.current);
    preference.addEventListener('change', change);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      preference.removeEventListener('change', change);
      document.removeEventListener('visibilitychange', visibility);
      observer.disconnect();
    };
  }, []);
  const render = available && !reduced && !failed;
  const active = shouldAnimate(paused, reduced, visible, intersecting);
  return (
    <>
      <div
        ref={host}
        className={`hero-art ${render && ready ? 'scene-loaded' : ''}`}
        aria-hidden="true"
        data-scene={
          failed
            ? 'fallback'
            : reduced
              ? 'reduced'
              : render
                ? ready
                  ? 'ready'
                  : 'loading'
                : 'unsupported'
        }
      >
        <img className="scene-poster" src="/images/scene/poster.webp" alt="" fetchPriority="high" />
        {render && (
          <div className="scene-live" style={{ visibility: ready ? 'visible' : 'hidden' }}>
            <img className="scene-sky" src="/images/scene/sky.webp" alt="" />
            <SceneBoundary onFailure={onFailure}>
              <Suspense fallback={null}>
                <SpaceCanvas active={active} onReady={onReady} onFailure={onFailure} />
              </Suspense>
            </SceneBoundary>
            <div className="scene-sun" />
            <img className="scene-foreground" src="/images/scene/foreground.webp" alt="" />
          </div>
        )}
      </div>
      {render ? (
        <button className="motion-control" onClick={() => setPaused(!paused)} aria-pressed={paused}>
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          {paused ? 'Resume animation' : 'Pause animation'}
        </button>
      ) : (
        <p className="scene-status">{reduced ? 'Still view · reduced motion' : 'Still view'}</p>
      )}
    </>
  );
}
