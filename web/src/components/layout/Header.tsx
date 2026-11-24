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
  return <HeaderContents key={pathname} pathname={pathname} />;
}
function HeaderContents({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !header.current?.contains(event.target)) setOpen(false);
    };
    const resized = () => setOpen(false);
    const breakpoint = window.matchMedia('(max-width: 760px)');
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', outside);
    breakpoint.addEventListener('change', resized);
    return () => {
      document.removeEventListener('keydown', close);
      document.removeEventListener('pointerdown', outside);
      breakpoint.removeEventListener('change', resized);
    };
  }, [open]);
  return (
    <header
      ref={header}
      className="site-header"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <Link className="brand" to="/" aria-label="AzenoHI.dev — Home">
        <Brand />
      </Link>
      <button
        ref={button}
        className="menu-button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="primary-nav"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav
        id="primary-nav"
        aria-label="Primary navigation"
        className={open ? 'nav is-open' : 'nav'}
      >
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => {
              setOpen(false);
              if (item.to === pathname) button.current?.focus();
            }}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
