import { NavLink, Outlet } from 'react-router-dom';
import { classNames } from '../lib/utils';

const NAV = [
  { to: '/', label: 'Pregled', end: true },
  { to: '/utakmice', label: 'Utakmice' },
  { to: '/ekipe', label: 'Ekipe' },
  { to: '/ladder', label: 'Ladder' },
  { to: '/strijelci', label: 'Strijelci' },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b border-black/5">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <NavLink to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-brand-blue grid place-items-center">
              <div className="w-3 h-3 rounded-full bg-brand-red" />
            </div>
            <div className="leading-none">
              <div className="font-display text-lg tracking-wider">MIOC TURNIR</div>
              <div className="font-cond text-[10px] tracking-widest text-black/40 uppercase">
                XV. gimnazija · 2026
              </div>
            </div>
          </NavLink>
        </div>
        <nav className="max-w-3xl mx-auto px-2 pb-2 flex gap-1 overflow-x-auto">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                classNames(
                  'px-3 py-1.5 rounded-full font-cond font-bold text-sm tracking-wider uppercase whitespace-nowrap transition',
                  isActive ? 'bg-brand-dark text-white' : 'text-black/60 hover:bg-black/5'
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="max-w-3xl mx-auto w-full px-4 py-6 text-center text-xs text-black/30 font-cond tracking-widest uppercase">
        Vijeće učenika · XV. gimnazija
      </footer>
    </div>
  );
}
