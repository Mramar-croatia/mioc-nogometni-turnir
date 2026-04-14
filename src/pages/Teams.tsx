import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMatches, useTeams } from '../lib/hooks';
import { useFollowedTeams } from '../lib/favorites';
import { buildResultsCsv, downloadCsv } from '../lib/resultsExport';
import { SkeletonTeamGrid } from '../components/Skeleton';
import { classNames, getDivisionKey, getDivisionLabel } from '../lib/utils';
import type { Team } from '../lib/types';

export default function Teams() {
  const teams = useTeams();
  const matches = useMatches();
  const [search, setSearch] = useState('');
  const { isFollowed, toggle } = useFollowedTeams();

  const filteredTeams = useMemo(() => {
    if (!teams) return [];
    if (!search.trim()) return teams;
    const q = search.toLowerCase();
    return teams.filter((t) =>
      t.code.toLowerCase().includes(q) ||
      t.displayName?.toLowerCase().includes(q) ||
      t.captain?.toLowerCase().includes(q) ||
      t.players?.some((p) => p.name.toLowerCase().includes(q))
    );
  }, [teams, search]);

  if (teams === null) {
    return (
      <div className="space-y-6">
        <div>
          <div className="font-cond text-xs font-bold uppercase tracking-[0.18em] text-black/45">Sudionici</div>
          <h1 className="font-display text-5xl leading-none tracking-[0.04em] mt-2">Ekipe</h1>
        </div>
        <SkeletonTeamGrid count={9} />
      </div>
    );
  }

  const muski = filteredTeams.filter((t) => getDivisionKey(t.division) === 'm');
  const zenske = filteredTeams.filter((t) => getDivisionKey(t.division) === 'z');
  const finishedMatches = matches?.filter((match) => match.status === 'finished') ?? [];

  function exportResults() {
    if (!teams || finishedMatches.length === 0) return;
    const map = new Map(teams.map((t) => [t.id, t]));
    downloadCsv('mioc-turnir-rezultati.csv', buildResultsCsv(finishedMatches, map));
  }

  return (
    <div className="space-y-6">
      <header className="grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <div className="font-cond text-xs font-bold uppercase tracking-[0.18em] text-black/45">Sudionici</div>
          <h1 className="font-display text-5xl leading-none tracking-[0.04em] mt-2">Ekipe</h1>
        </div>
        {finishedMatches.length > 0 && (
          <button onClick={exportResults} className="btn-ghost justify-self-start lg:justify-self-end" title="Izvezi rezultate">
            Izvezi rezultate
          </button>
        )}
      </header>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Pretrazi ekipu, kapetana ili igraca..."
        className="input"
      />

      {filteredTeams.length === 0 && (
        <div className="card p-8 text-black/45 text-center">Nista nije pronadeno.</div>
      )}

      <Group title="Muski" teams={muski} isFollowed={isFollowed} toggle={toggle} />
      {zenske.length > 0 && <Group title="Zenski" teams={zenske} isFollowed={isFollowed} toggle={toggle} />}
    </div>
  );
}

function Group({ title, teams, isFollowed, toggle }: {
  title: string;
  teams: Team[];
  isFollowed: (id: string) => boolean;
  toggle: (id: string) => void;
}) {
  if (teams.length === 0) return null;
  const sorted = [...teams].sort((a, b) => {
    const fa = isFollowed(a.id) ? 0 : 1;
    const fb = isFollowed(b.id) ? 0 : 1;
    return fa - fb || a.code.localeCompare(b.code, 'hr');
  });
  return (
    <section className="space-y-3">
      <h2 className="font-cond font-extrabold text-xs tracking-[0.18em] uppercase text-black/45">{title}</h2>
      <div className="space-y-3">
        {sorted.map((t) => {
          const followed = isFollowed(t.id);
          return (
            <Link
              key={t.id}
              to={`/ekipe/${t.id}`}
              className="card flex items-center gap-4 px-4 py-4 transition hover:border-black/15"
            >
              <div className="w-20 shrink-0">
                <div className="font-display text-4xl leading-none truncate" style={t.color ? { color: t.color } : undefined}>
                  {t.code}
                </div>
                <div className="font-cond text-[10px] uppercase tracking-[0.16em] text-black/35 mt-1">
                  {getDivisionLabel(t.division)}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                {t.displayName && t.displayName !== t.code && (
                  <div className="font-semibold truncate">{t.displayName}</div>
                )}
                <div className="text-sm text-black/60 truncate">Kapetan: {t.captain || 'nije unesen'}</div>
                <div className="text-xs text-black/40 mt-1">{t.playersCount} igraca</div>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); toggle(t.id); }}
                className={classNames(
                  'w-10 h-10 grid place-items-center rounded-full text-xl transition shrink-0',
                  followed ? 'bg-brand-blue/10 text-brand-blue' : 'text-black/25 hover:bg-black/5 hover:text-black/55'
                )}
                aria-label={followed ? 'Prestani pratiti' : 'Prati ekipu'}
                title={followed ? 'Pratis' : 'Prati ekipu'}
              >
                {followed ? '★' : '☆'}
              </button>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
