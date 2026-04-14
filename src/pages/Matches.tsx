import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMatches, useTeams } from '../lib/hooks';
import { SkeletonList } from '../components/Skeleton';
import { classNames } from '../lib/utils';
import type { Match, Team } from '../lib/types';

type Filter = 'all' | 'finished' | 'scheduled';

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
    const filtered = matches.filter((m) =>
      filter === 'all' ? true :
      filter === 'finished' ? m.status === 'finished' :
      m.status === 'scheduled' || m.status === 'live'
    );
    const map = new Map<string, Match[]>();
    filtered.forEach((m) => {
      const arr = map.get(m.date) ?? [];
      arr.push(m);
      map.set(m.date, arr);
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

  const teamMap = new Map(teams.map((t) => [t.id, t]));

  return (
    <div className="space-y-6">
      <PageHeader />

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
              filter === k
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
          {grouped.map(([date, list], gi) => (
            <div key={date} className={classNames(gi > 0 && 'mt-5')}>
              <div className="flex items-center gap-2 px-1 mb-1.5">
                <div className="font-cond text-[11px] font-bold uppercase tracking-[0.14em] text-brand-dark">
                  {dayShort(date)}
                </div>
                <div className="text-[11px] font-medium text-black/35">
                  {dateShort(date)}
                </div>
                <div className="flex-1 h-px bg-black/8" />
              </div>

              {list.map((m) => (
                <MatchRow
                  key={m.id}
                  match={m}
                  home={teamMap.get(m.homeId)}
                  away={teamMap.get(m.awayId)}
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
      <p className="text-black/55 mt-3">Sve utakmice grupirane po danu.</p>
    </header>
  );
}

function MatchRow({ match, home, away }: { match: Match; home?: Team; away?: Team }) {
  const completed = match.status === 'finished';
  const live = match.status === 'live';
  const homeWinner = completed && match.winnerId === match.homeId;
  const awayWinner = completed && match.winnerId === match.awayId;

  return (
    <Link
      to={`/utakmice/${match.id}`}
      className={classNames(
        'flex items-center rounded-xl px-3.5 py-2.5 mb-[5px] last:mb-0 transition',
        completed
          ? 'bg-emerald-50/70 ring-1 ring-inset ring-emerald-100 hover:bg-emerald-50'
          : live
          ? 'bg-brand-red/5 ring-1 ring-inset ring-brand-red/15 hover:bg-brand-red/10'
          : 'hover:bg-black/[0.03]'
      )}
    >
      <div className="font-mono text-[11px] font-semibold text-black/40 w-[42px] shrink-0">
        {match.time}
      </div>
      <div className="flex-1 flex items-center justify-center gap-3">
        <div
          className={classNames(
            'text-[15px] min-w-[52px] text-right',
            homeWinner ? 'font-extrabold text-emerald-700' : 'font-bold text-black/85'
          )}
        >
          {home?.code ?? '?'}
        </div>
        <div
          className={classNames(
            'rounded-full px-2.5 py-[3px] text-[10px] font-bold uppercase tracking-[0.06em] shrink-0',
            completed
              ? 'bg-emerald-100 text-emerald-700'
              : live
              ? 'bg-brand-red text-white'
              : 'bg-brand-blue/10 text-brand-blue'
          )}
        >
          {completed ? `${match.homeScore}:${match.awayScore}` : live ? 'LIVE' : 'vs'}
        </div>
        <div
          className={classNames(
            'text-[15px] min-w-[52px] text-left',
            awayWinner ? 'font-extrabold text-emerald-700' : 'font-bold text-black/85'
          )}
        >
          {away?.code ?? '?'}
        </div>
      </div>
    </Link>
  );
}
