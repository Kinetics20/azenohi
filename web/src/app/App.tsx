import { useEffect, useRef } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Home } from '../pages/Home';
import { Team } from '../pages/Team';
import { Projects } from '../pages/Projects';
import { Journey } from '../pages/Journey';
import { ProjectDetail, NotFound } from '../pages/ProjectDetail';
function RouteEffects() {
  const { pathname } = useLocation();
  const previous = useRef(pathname);
  useEffect(() => {
    document.title = `${pathname === '/' ? 'Hybrid Intelligence' : pathname.split('/').at(-1)!.replaceAll('-', ' ')} — AzenoHI.dev`;
    if (previous.current !== pathname) {
      window.scrollTo(0, 0);
      document.getElementById('main-content')?.focus();
      previous.current = pathname;
    }
  }, [pathname]);
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
