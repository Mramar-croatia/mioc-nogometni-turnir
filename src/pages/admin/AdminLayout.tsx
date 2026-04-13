import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuthUser, useIsAdmin } from '../../lib/hooks';
import Loading from '../../components/Loading';
import { classNames } from '../../lib/utils';

const NAV = [
  { to: '/admin', label: 'Utakmice', end: true },
  { to: '/admin/ekipe', label: 'Ekipe' },
  { to: '/admin/ladder', label: 'Ladder' },
  { to: '/admin/organizatori', label: 'Organizatori' },
];

export default function AdminLayout() {
  const user = useAuthUser();
  const isAdmin = useIsAdmin(user);
  const nav = useNavigate();

  if (user === undefined || isAdmin === undefined) return <Loading />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="card p-6 max-w-sm text-center">
          <h2 className="font-display text-2xl mb-2">Nemate pristup</h2>
          <p className="text-sm text-black/55 mb-4">
            Vaš korisnik ({user.email}) nije ovlašten kao organizator. Drugi admin Vas mora dodati.
          </p>
          <button className="btn-ghost" onClick={() => signOut(auth).then(() => nav('/admin/login'))}>
            Odjavi se
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-brand-dark text-white">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <NavLink to="/admin" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-red grid place-items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
            </div>
            <div className="font-display text-lg tracking-wider">ADMIN · MIOC</div>
          </NavLink>
          <div className="flex items-center gap-2">
            <NavLink to="/" className="font-cond text-xs uppercase tracking-widest text-white/60 hover:text-white">Javni dio</NavLink>
            <button
              onClick={() => signOut(auth).then(() => nav('/admin/login'))}
              className="font-cond text-xs uppercase tracking-widest text-white/60 hover:text-white"
            >
              Odjava
            </button>
          </div>
        </div>
        <nav className="max-w-3xl mx-auto px-2 pb-2 flex gap-1 overflow-x-auto">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                classNames(
                  'px-3 py-1.5 rounded-full font-cond font-bold text-sm tracking-wider uppercase whitespace-nowrap',
                  isActive ? 'bg-white text-brand-dark' : 'text-white/60 hover:bg-white/10'
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
    </div>
  );
}
