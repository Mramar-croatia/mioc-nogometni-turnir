import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAllGoals, useMatches, useTeam, useTeams } from '../lib/hooks';
import { buildResultsCsv, downloadCsv } from '../lib/resultsExport';
import MatchCard from '../components/MatchCard';
import TeamEliminationBadge from '../components/TeamEliminationBadge';
import Loading from '../components/Loading';
import { getTeamEliminationState } from '../lib/teamElimination';
import { classNames, getDivisionLabel, tallyNames } from '../lib/utils';

export default function TeamDetail() {
  const { id } = useParams();
  const team = useTeam(id);
  const allMatches = useMatches();
  const allTeams = useTeams();
  const allGoals = useAllGoals(allMatches);

  const stats = useMemo(() => {
    if (!allMatches || !id) return null;
    const matches = allMatches.filter((m) => m.homeId === id || m.awayId === id);
    const played = matches.filter((m) => m.status === 'finished');
    let gf = 0;
    let ga = 0;
    let w = 0;
    let l = 0;
    for (const m of played) {
      const isHome = m.homeId === id;
      const scoredFor = isHome ? m.homeScore : m.awayScore;
      const scoredAgainst = isHome ? m.awayScore : m.homeScore;
      gf += scoredFor;
      ga += scoredAgainst;
      if (m.winnerId === id) w += 1;
      else l += 1;
    }
    return { matches, played, upcoming: matches.filter((m) => m.status !== 'finished'), gf, ga, w, l };
  }, [allMatches, id]);

  const teamScorers = useMemo(() => {
    if (!allGoals || !id) return [];
    return Array.from(tallyNames(allGoals.filter((g) => g.teamId === id)).values())
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'hr'))
      .map((entry) => [entry.name, entry.count] as const);
  }, [allGoals, id]);

  if (team === undefined || allMatches === null || allTeams === null) return <Loading />;
  if (team === null) return <div className="card p-8 text-center text-black/45">Ekipa nije pronađena.</div>;
  const currentTeam = team;

  const teamMap = new Map(allTeams.map((t) => [t.id, t]));
  const elimination = getTeamEliminationState(currentTeam.id, allMatches, currentTeam.eliminationOverride);

  function exportTeamResults() {
    if (!stats) return;
    downloadCsv(`${currentTeam.code}-rezultati.csv`, buildResultsCsv(stats.played, teamMap));
  }

  return (
    <div className="space-y-6">
      <Link to="/ekipe" className="font-cond text-xs tracking-[0.18em] uppercase text-black/40 inline-block">
        ← Sve ekipe
      </Link>

      <div className={classNames('card p-6 relative overflow-hidden', elimination.effectiveEliminated && 'ring-1 ring-inset ring-brand-red/15 bg-brand-red/[0.03]')}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-cond text-xs tracking-[0.18em] uppercase text-black/40">{getDivisionLabel(currentTeam.division)}</div>
          <TeamEliminationBadge state={elimination} teamCode={currentTeam.code} variant="detail" showManualNote />
        </div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div
              className={classNames('font-display text-6xl leading-none truncate', elimination.effectiveEliminated && 'opacity-80')}
              style={currentTeam.color ? { color: currentTeam.color } : undefined}
            >
              {currentTeam.code}
            </div>
            {currentTeam.displayName && currentTeam.displayName !== currentTeam.code && (
              <div className={classNames('text-lg mt-2', elimination.effectiveEliminated ? 'text-black/55' : 'text-black/65')}>{currentTeam.displayName}</div>
            )}
            {currentTeam.captain?.trim() && (
              <div className="text-sm text-black/50 mt-2">Kapetan: {currentTeam.captain}</div>
            )}
          </div>
          <div className="text-sm text-black/50">{currentTeam.playersCount} igrača</div>
        </div>
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <Stat label="Pobjede" value={stats.w} />
            <Stat label="Porazi" value={stats.l} />
            <Stat label="Zabijeno" value={stats.gf} />
            <Stat label="Primljeno" value={stats.ga} />
          </div>
        )}
        {stats && stats.played.length > 0 && (
          <button onClick={exportTeamResults} className="btn-ghost w-full mt-5">
            Izvezi rezultate
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-3">
          <h2 className="font-cond font-extrabold text-xs tracking-[0.18em] uppercase text-black/45">Igrači</h2>
          <div className="card p-4">
            <ul className="divide-y divide-black/5">
              {currentTeam.players.map((p, i) => (
                <li
                  key={i}
                  className={classNames(
                    'py-3 flex items-center justify-between gap-3 px-3 -mx-3',
                    p.is_captain && 'bg-brand-blue/[0.04] border-l-2 border-brand-blue rounded-r'
                  )}
                >
                  <span className="font-medium">{p.name}</span>
                  {p.is_captain && <span className="pill border-brand-blue/10 bg-brand-blue/10 text-brand-blue">Kapetan</span>}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {teamScorers.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-cond font-extrabold text-xs tracking-[0.18em] uppercase text-black/45">Strijelci ekipe</h2>
            <div className="card divide-y divide-black/5">
              {teamScorers.map(([name, n]) => (
                <div key={name} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex-1 font-medium truncate">{name}</span>
                  <span className="font-display text-2xl text-brand-blue">{n}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {stats && stats.upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-cond font-extrabold text-xs tracking-[0.18em] uppercase text-black/45">Sljedeće utakmice</h2>
          {stats.upcoming.map((m, i) => (
            <MatchCard key={m.id} match={m} home={teamMap.get(m.homeId)} away={teamMap.get(m.awayId)} index={i} compact />
          ))}
        </section>
      )}

      {stats && stats.played.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-cond font-extrabold text-xs tracking-[0.18em] uppercase text-black/45">Odigrane utakmice</h2>
          {stats.played.map((m, i) => (
            <MatchCard key={m.id} match={m} home={teamMap.get(m.homeId)} away={teamMap.get(m.awayId)} index={i} compact />
          ))}
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-black/6 bg-black/[0.02] px-4 py-4 text-center">
      <div className="font-display text-4xl leading-none">{value}</div>
      <div className="font-cond text-[10px] uppercase tracking-[0.16em] text-black/40 mt-2">{label}</div>
    </div>
  );
}
