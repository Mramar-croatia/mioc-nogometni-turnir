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
      <div>
        <h1 className="font-display text-4xl mb-5 tracking-wide">Utakmice</h1>
        <SkeletonList count={5} />
      </div>
    );
  }
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  return (
    <div>
      <h1 className="font-display text-4xl mb-4 tracking-wide">Utakmice</h1>

      <div className="flex gap-2 mb-5">
        {([
          ['all', 'Sve'],
          ['scheduled', 'Predstojeće'],
          ['finished', 'Odigrane'],
        ] as [Filter, string][]).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={classNames(
              'pill transition',
              filter === k ? 'bg-brand-dark text-white' : 'bg-black/5 text-black/55 hover:bg-black/10'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {grouped.length === 0 && <div className="text-black/40 text-center py-10">Nema utakmica.</div>}

      {grouped.map(([date, list]) => (
        <div key={date} className="mb-7">
          <h2 className="font-cond font-extrabold text-xs tracking-widest uppercase text-black/45 mb-3">
            {formatDateHr(date)}
          </h2>
          {list.map((m, i) => (
            <MatchCard key={m.id} match={m} home={teamMap.get(m.homeId)} away={teamMap.get(m.awayId)} index={i} compact />
          ))}
        </div>
      ))}
    </div>
  );
}
