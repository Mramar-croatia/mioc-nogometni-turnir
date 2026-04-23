import { useMemo, useState } from 'react';
import { useMatches, useTeams } from '../lib/hooks';
import MatchRow from '../components/MatchRow';
import { SkeletonList } from '../components/Skeleton';
import { classNames } from '../lib/utils';
import type { Match } from '../lib/types';

type Filter = 'all' | 'finished' | 'scheduled' | 'round-one';

const FILTER_OPTIONS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'Sve' },
  { key: 'round-one', label: 'Utakmice prvog kola' },
  { key: 'scheduled', label: 'Sljedeće' },
  { key: 'finished', label: 'Odigrane' },
];

const DAY_SHORT_HR = ['Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub'];

function dayShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return DAY_SHORT_HR[d.getDay()];
}

function dateShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()}. ${d.getMonth() + 1}.`;
}

export default function Matches() {
  const matches = useMatches();
  const teams = useTeams();
  const [filter, setFilter] = useState<Filter>('all');

  const grouped = useMemo(() => {
    if (!matches) return [];
    const filtered = matches.filter((match) => {
      if (filter === 'round-one') return match.stage === 'R1';
      if (match.stage === 'R1') return false;
      if (filter === 'all') return true;
      if (filter === 'finished') return match.status === 'finished';
      return match.status === 'scheduled' || match.status === 'live';
    });

    const map = new Map<string, Match[]>();
    filtered.forEach((match) => {
      const arr = map.get(match.date) ?? [];
      arr.push(match);
      map.set(match.date, arr);
    });

    for (const arr of map.values()) {
      arr.sort((a, b) => a.time.localeCompare(b.time));
    }

    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [matches, filter]);

  if (matches === null || teams === null) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <SkeletonList count={5} />
      </div>
    );
  }

  const teamMap = new Map(teams.map((team) => [team.id, team]));

  return (
    <div className="space-y-6">
      <PageHeader />

      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={classNames(
              'pill transition',
              filter === key
                ? 'border-brand-dark bg-brand-dark text-white'
                : 'text-black/55 hover:border-black/15'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <div className="card p-8 text-black/45 text-center">
          Nema utakmica za odabrani filter.
        </div>
      ) : (
        <div className="card px-5 py-6 sm:px-7 sm:py-7 max-w-[520px]">
          {grouped.map(([date, list], groupIndex) => (
            <div key={date} className={classNames(groupIndex > 0 && 'mt-5')}>
              <div className="flex items-center gap-2 px-1 mb-1.5">
                <div className="font-cond text-[11px] font-bold uppercase tracking-[0.14em] text-brand-dark">
                  {dayShort(date)}
                </div>
                <div className="text-[11px] font-medium text-black/35">
                  {dateShort(date)}
                </div>
                <div className="flex-1 h-px bg-black/8" />
              </div>

              {list.map((match) => (
                <MatchRow
                  key={match.id}
                  match={match}
                  home={teamMap.get(match.homeId)}
                  away={teamMap.get(match.awayId)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PageHeader() {
  return (
    <header>
      <div className="font-cond text-xs font-bold uppercase tracking-[0.18em] text-black/45">
        Raspored
      </div>
      <h1 className="font-display text-5xl leading-none tracking-[0.04em] mt-2">
        Utakmice
      </h1>
      <p className="text-black/55 mt-3">Raspored utakmica u turniru.</p>
    </header>
  );
}
