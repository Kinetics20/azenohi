import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { navigation } from '../../data/content';
export function Brand() {
  return (
    <>
      <svg aria-hidden="true" className="brand-mark" viewBox="0 0 56 42">
        <path d="M25 2h20L21 40H1zM40 16h16L41 40H25z" fill="currentColor" />
      </svg>
      <span>
        Azeno<strong>HI</strong>.dev
      </span>
    </>
  );
}
export function Header() {
  const { pathname } = useLocation();
  return <HeaderContents key={pathname} />;
}
function HeaderContents() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open]);
  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="AzenoHI.dev — Home">
        <Brand />
      </Link>
      <button
        ref={button}
        className="menu-button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="primary-nav"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav
        id="primary-nav"
        aria-label="Primary navigation"
        className={open ? 'nav is-open' : 'nav'}
      >
        {navigation.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
