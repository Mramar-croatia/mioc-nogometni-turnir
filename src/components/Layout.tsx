import siteLogo from '../../logo.jpeg';
import { NavLink, Outlet } from 'react-router-dom';
import { classNames } from '../lib/utils';

const NAV = [
  { to: '/', label: 'Pregled', icon: HomeIcon, end: true },
  { to: '/utakmice', label: 'Raspored', icon: BallIcon },
  { to: '/ekipe', label: 'Ekipe', icon: TeamIcon },
  { to: '/ladder', label: 'Faze', icon: TrophyIcon },
  { to: '/strijelci', label: 'Strijelci', icon: StarIcon },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-black/8 bg-white/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-end justify-between gap-4">
          <NavLink to="/" className="block shrink-0">
            <div className="font-cond text-[11px] font-bold tracking-[0.24em] uppercase text-black/45">
              MIOC nogometni turnir
            </div>
            <div className="font-display text-4xl leading-none tracking-[0.06em] text-brand-dark">
              2026
            </div>
          </NavLink>
          <NavLink to="/" className="shrink-0">
            <img
              src={siteLogo}
              alt="MIOC Turnir logo"
              className="h-14 w-14 sm:h-16 sm:w-16 object-cover rounded-2xl border border-black/8 shadow-card"
            />
          </NavLink>
        </div>
        <nav className="hidden sm:flex max-w-5xl mx-auto px-4 pb-3 gap-2 overflow-x-auto">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                classNames(
                  'px-4 py-2 rounded-xl font-cond font-bold text-sm tracking-[0.16em] uppercase whitespace-nowrap transition border',
                  isActive
                    ? 'bg-brand-dark border-brand-dark text-white'
                    : 'border-black/8 bg-white text-black/60 hover:border-black/15 hover:text-brand-dark'
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 pb-24 sm:pb-10">
        <Outlet />
      </main>

      <footer className="max-w-5xl mx-auto w-full px-4 py-8 pb-24 sm:pb-8 text-sm text-black/35">
        <div className="border-t border-black/8 pt-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span>XV. gimnazija, Zagreb</span>
          <span className="font-cond uppercase tracking-[0.16em]">Vijeće ucenika</span>
        </div>
      </footer>

      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/96 backdrop-blur border-t border-black/8 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-5xl mx-auto flex items-stretch">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  classNames(
                    'flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-cond font-bold tracking-[0.14em] uppercase transition',
                    isActive ? 'text-brand-dark' : 'text-black/45'
                  )
                }
              >
                <Icon />
                <span>{n.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function BallIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v5M12 16v5M3 12h5M16 12h5M5.5 5.5l3.5 3.5M15 15l3.5 3.5M18.5 5.5L15 9M9 15l-3.5 3.5" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20c0-3 3-5 6-5s6 2 6 5M15 20c0-2 2-3.5 4-3.5s3 1 3 3" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M4 5h3v3a2 2 0 0 1-3-1zM20 5h-3v3a2 2 0 0 0 3-1z" />
      <path d="M9 14h6v2l1 4H8l1-4z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 3 14.8 9.3 21.6 10 16.5 14.6 18 21 12 17.6 6 21 7.5 14.6 2.4 10 9.2 9.3" />
    </svg>
  );
}
