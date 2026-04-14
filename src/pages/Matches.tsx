import { useMemo, useState } from 'react';
import { useMatches, useTeams } from '../lib/hooks';
import MatchCard from '../components/MatchCard';
import { SkeletonList } from '../components/Skeleton';
import { classNames, formatDateHr } from '../lib/utils';

type Filter = 'all' | 'finished' | 'scheduled';

export default function Matches() {
  const matches = useMatches();
  const teams = useTeams();
  const [filter, setFilter] = useState<Filter>('all');

  const grouped = useMemo(() => {
    if (!matches) return [];
    const filtered = matches.filter((m) =>
      filter === 'all' ? true :
      filter === 'finished' ? m.status === 'finished' :
      m.status === 'scheduled' || m.status === 'live'
    );
    const map = new Map<string, typeof filtered>();
    filtered.forEach((m) => {
      const arr = map.get(m.date) ?? [];
      arr.push(m);
      map.set(m.date, arr);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [matches, filter]);

  if (matches === null || teams === null) {
    return (
      <div className="space-y-6">
        <div>
          <div className="font-cond text-xs font-bold uppercase tracking-[0.18em] text-black/45">Raspored</div>
          <h1 className="font-display text-5xl leading-none tracking-[0.04em] mt-2">Utakmice</h1>
        </div>
        <SkeletonList count={5} />
      </div>
    );
  }

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const liveCount = matches.filter((m) => m.status === 'live').length;
  const upcomingCount = matches.filter((m) => m.status === 'scheduled').length;
  const finishedCount = matches.filter((m) => m.status === 'finished').length;

  return (
    <div className="space-y-6">
      <header className="grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <div className="font-cond text-xs font-bold uppercase tracking-[0.18em] text-black/45">Raspored</div>
          <h1 className="font-display text-5xl leading-none tracking-[0.04em] mt-2">Utakmice</h1>
          <p className="text-black/55 mt-3">Sve utakmice su grupirane po datumu.</p>
        </div>
        <div className="card p-5 grid grid-cols-3 gap-3">
          <MiniStat label="Uzivo" value={liveCount} />
          <MiniStat label="Sljedece" value={upcomingCount} />
          <MiniStat label="Gotove" value={finishedCount} />
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {([
          ['all', 'Sve'],
          ['scheduled', 'Sljedece'],
          ['finished', 'Odigrane'],
        ] as [Filter, string][]).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={classNames(
              'pill transition',
              filter === k ? 'border-brand-dark bg-brand-dark text-white' : 'text-black/55 hover:border-black/15'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {grouped.length === 0 && <div className="card p-8 text-black/45 text-center">Nema utakmica za odabrani filter.</div>}

      {grouped.map(([date, list]) => (
        <section key={date} className="space-y-3">
          <h2 className="font-cond font-extrabold text-xs tracking-[0.18em] uppercase text-black/45">
            {formatDateHr(date)}
          </h2>
          {list.map((m, i) => (
            <MatchCard key={m.id} match={m} home={teamMap.get(m.homeId)} away={teamMap.get(m.awayId)} index={i} compact />
          ))}
        </section>
      ))}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-display text-3xl leading-none">{value}</div>
      <div className="font-cond text-[10px] uppercase tracking-[0.16em] text-black/40 mt-1">{label}</div>
    </div>
  );
}
