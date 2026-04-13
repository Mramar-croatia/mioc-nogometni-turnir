import { Link } from 'react-router-dom';
import { useMatches, useTeams } from '../../lib/hooks';
import Loading from '../../components/Loading';
import { classNames, formatDateHr } from '../../lib/utils';

export default function Dashboard() {
  const matches = useMatches();
  const teams = useTeams();

  if (matches === null || teams === null) return <Loading />;
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  if (matches.length === 0) {
    return (
      <div className="card p-6 text-center">
        <h2 className="font-display text-2xl mb-2">Početak rada</h2>
        <p className="text-black/55 mb-4">Nema utakmica. Učitaj početne podatke iz <code>data.json</code>.</p>
        <Link to="/admin/inicijalizacija" className="btn-primary">Inicijaliziraj turnir</Link>
      </div>
    );
  }

  const grouped = new Map<string, typeof matches>();
  matches.forEach((m) => {
    const arr = grouped.get(m.date) ?? [];
    arr.push(m);
    grouped.set(m.date, arr);
  });
  const groups = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div>
      <h1 className="font-display text-3xl mb-1 tracking-wide">Utakmice</h1>
      <p className="text-sm text-black/50 mb-5">Klikni utakmicu za unos rezultata i golova.</p>

      {groups.map(([date, list]) => (
        <div key={date} className="mb-6">
          <h2 className="font-cond font-extrabold text-xs tracking-widest uppercase text-black/45 mb-2">
            {formatDateHr(date)}
          </h2>
          <div className="space-y-2">
            {list.map((m) => (
              <Link
                key={m.id}
                to={`/admin/utakmica/${m.id}`}
                className="card flex items-center gap-3 px-4 py-3"
              >
                <div className="font-cond text-xs text-black/40 w-12">{m.time}</div>
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-display text-xl">{teamMap.get(m.homeId)?.code ?? '?'}</span>
                  <span className="text-black/30">vs</span>
                  <span className="font-display text-xl">{teamMap.get(m.awayId)?.code ?? '?'}</span>
                </div>
                <span
                  className={classNames(
                    'pill',
                    m.status === 'finished' && 'bg-black/5 text-black/45',
                    m.status === 'live' && 'bg-brand-red/10 text-brand-red',
                    m.status === 'scheduled' && 'bg-brand-blue/10 text-brand-blue'
                  )}
                >
                  {m.status === 'finished' ? `${m.homeScore}:${m.awayScore}` : m.status === 'live' ? 'UŽIVO' : 'PLANIRANO'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
