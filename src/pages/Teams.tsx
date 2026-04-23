import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import TeamEliminationBadge from '../components/TeamEliminationBadge';
import { SkeletonTeamGrid } from '../components/Skeleton';
import { useFollowedTeams } from '../lib/favorites';
import { useMatches, useTeams } from '../lib/hooks';
import { buildResultsCsv, downloadCsv } from '../lib/resultsExport';
import { getTeamEliminationState } from '../lib/teamElimination';
import type { Match, Team } from '../lib/types';
import { classNames, getDivisionKey, getDivisionLabel } from '../lib/utils';

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
        <PageHeader />
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
        <PageHeader />
        {finishedMatches.length > 0 && (
          <button
            onClick={exportResults}
            className="btn-ghost justify-self-start lg:justify-self-end"
            title="Izvezi rezultate"
          >
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

      <Group title="Muski" teams={muski} matches={matches ?? []} isFollowed={isFollowed} toggle={toggle} accent="blue" />
      {zenske.length > 0 && (
        <Group title="Ženski" teams={zenske} matches={matches ?? []} isFollowed={isFollowed} toggle={toggle} accent="red" />
      )}
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <div className="font-cond text-xs font-bold uppercase tracking-[0.18em] text-black/45">
        Sudionici
      </div>
      <h1 className="font-display text-5xl leading-none tracking-[0.04em] mt-2">Ekipe</h1>
      <p className="text-black/55 mt-3">Sve ekipe i igraci turnira.</p>
    </div>
  );
}

function Group({
  title,
  teams,
  matches,
  isFollowed,
  toggle,
  accent,
}: {
  title: string;
  teams: Team[];
  matches: Match[];
  isFollowed: (id: string) => boolean;
  toggle: (id: string) => void;
  accent: 'blue' | 'red';
}) {
  if (teams.length === 0) return null;
  const sorted = [...teams].sort((a, b) => {
    const fa = isFollowed(a.id) ? 0 : 1;
    const fb = isFollowed(b.id) ? 0 : 1;
    return fa - fb || a.code.localeCompare(b.code, 'hr');
  });
  const accentBar = accent === 'blue' ? 'bg-brand-blue' : 'bg-brand-red';
  const accentText = accent === 'blue' ? 'text-brand-blue' : 'text-brand-red';
  const accentBg = accent === 'blue' ? 'bg-brand-blue/10' : 'bg-brand-red/10';

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5">
        <span className={`inline-block w-1 h-4 rounded-full ${accentBar}`} />
        <h2 className="font-cond font-extrabold text-xs tracking-[0.18em] uppercase text-black/55">
          {title}
        </h2>
        <span
          className={classNames(
            'font-cond text-[11px] font-bold uppercase tracking-[0.14em] rounded-full px-2 py-[1px]',
            accentBg,
            accentText
          )}
        >
          {teams.length}
        </span>
      </div>

      <div className="card p-2 sm:p-3">
        {sorted.map((t) => (
          <TeamRow
            key={t.id}
            team={t}
            matches={matches}
            followed={isFollowed(t.id)}
            onToggle={() => toggle(t.id)}
          />
        ))}
      </div>
    </section>
  );
}

function TeamRow({
  team,
  matches,
  followed,
  onToggle,
}: {
  team: Team;
  matches: Match[];
  followed: boolean;
  onToggle: () => void;
}) {
  const hasCustomName = team.displayName && team.displayName !== team.code;
  const accentColor = team.color || undefined;
  const elimination = getTeamEliminationState(team.id, matches, team.eliminationOverride);

  return (
    <Link
      to={`/ekipe/${team.id}`}
      className={classNames(
        'relative flex items-center gap-4 rounded-xl px-3 py-3 mb-[5px] last:mb-0 transition',
        followed
          ? 'bg-brand-blue/[0.04] ring-1 ring-inset ring-brand-blue/15 hover:bg-brand-blue/[0.07]'
          : elimination.effectiveEliminated
            ? 'bg-brand-red/[0.04] ring-1 ring-inset ring-brand-red/15 hover:bg-brand-red/[0.07]'
            : 'hover:bg-black/[0.03]'
      )}
    >
      <span
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ background: elimination.effectiveEliminated ? '#d42a3c' : accentColor ?? 'rgba(0,0,0,0.08)' }}
      />
      <div className="w-[68px] shrink-0 pl-2">
        <div
          className={classNames('font-display text-[32px] leading-none tracking-wide truncate', elimination.effectiveEliminated && 'opacity-80')}
          style={accentColor ? { color: accentColor } : undefined}
        >
          {team.code}
        </div>
        <div className="font-cond text-[9px] uppercase tracking-[0.14em] text-black/35 mt-1">
          {getDivisionLabel(team.division)}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {hasCustomName && (
            <div className={classNames('font-semibold text-[15px] truncate', elimination.effectiveEliminated && 'text-black/70')}>
              {team.displayName}
            </div>
          )}
          <TeamEliminationBadge state={elimination} teamCode={team.code} />
        </div>
        <div className={classNames('text-sm truncate', elimination.effectiveEliminated ? 'text-black/55' : 'text-black/60')}>
          Kapetan: <span className="text-black/80">{team.captain || 'nije unesen'}</span>
        </div>
        <div className={classNames('font-cond text-[10px] uppercase tracking-[0.14em] mt-1', elimination.effectiveEliminated ? 'text-brand-red/70' : 'text-black/40')}>
          {team.playersCount} igraca
        </div>
      </div>

      <button
        onClick={(e) => {
          e.preventDefault();
          onToggle();
        }}
        className={classNames(
          'w-9 h-9 grid place-items-center rounded-full text-lg transition shrink-0',
          followed
            ? 'bg-brand-blue text-white shadow-sm'
            : 'text-black/30 hover:bg-black/5 hover:text-black/60'
        )}
        aria-label={followed ? 'Prestani pratiti' : 'Prati ekipu'}
        title={followed ? 'Pratis' : 'Prati ekipu'}
      >
        {followed ? '★' : '☆'}
      </button>
    </Link>
  );
}
