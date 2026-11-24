import { useEffect, useRef } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Home } from '../pages/Home';
import { Team } from '../pages/Team';
import { Projects } from '../pages/Projects';
import { Journey } from '../pages/Journey';
import { ProjectDetail, NotFound } from '../pages/ProjectDetail';
function RouteEffects() {
  const { pathname, hash } = useLocation();
  const route = pathname + hash;
  const previous = useRef(route);
  useEffect(() => {
    document.title = `${pathname === '/' ? 'Hybrid Intelligence' : pathname.split('/').at(-1)!.replaceAll('-', ' ')} — AzenoHI.dev`;
    const card = pathname === '/projects' ? document.getElementById(hash.slice(1)) : null;
    if (card?.classList.contains('project-card')) {
      card.focus({ preventScroll: true });
      card.scrollIntoView({ block: 'start' });
    } else if (previous.current !== route) {
      window.scrollTo(0, 0);
      document.getElementById('main-content')?.focus();
    }
    previous.current = route;
  }, [pathname, hash, route]);
  return null;
}
export function App() {
  return (
    <BrowserRouter>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <RouteEffects />
      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/team" element={<Team />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:slug" element={<ProjectDetail />} />
          <Route path="/journey" element={<Journey />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
