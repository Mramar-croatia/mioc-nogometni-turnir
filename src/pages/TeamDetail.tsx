import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAllGoals, useMatches, useTeam, useTeams } from '../lib/hooks';
import { useFollowedTeams } from '../lib/favorites';
import { buildResultsCsv, downloadCsv } from '../lib/resultsExport';
import MatchCard from '../components/MatchCard';
import Loading from '../components/Loading';
import { classNames, getDivisionLabel, tallyNames } from '../lib/utils';

export default function TeamDetail() {
  const { id } = useParams();
  const team = useTeam(id);
  const allMatches = useMatches();
  const allTeams = useTeams();
  const allGoals = useAllGoals(allMatches);
  const { isFollowed, toggle } = useFollowedTeams();

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
  if (team === null) return <div className="card p-8 text-center text-black/45">Ekipa nije pronadena.</div>;
  const currentTeam = team;

  const teamMap = new Map(allTeams.map((t) => [t.id, t]));
  const followed = isFollowed(currentTeam.id);

  function exportTeamResults() {
    if (!stats) return;
    downloadCsv(`${currentTeam.code}-rezultati.csv`, buildResultsCsv(stats.played, teamMap));
  }

  return (
    <div className="space-y-6">
      <Link to="/ekipe" className="font-cond text-xs tracking-[0.18em] uppercase text-black/40 inline-block">
        ← Sve ekipe
      </Link>

      <div className="card p-6 relative overflow-hidden">
        <button
          onClick={() => toggle(currentTeam.id)}
          className={classNames(
            'absolute top-4 right-4 w-10 h-10 grid place-items-center rounded-full text-2xl transition',
            followed ? 'bg-brand-blue/10 text-brand-blue' : 'text-black/25 hover:bg-black/5 hover:text-black/55'
          )}
          aria-label={followed ? 'Prestani pratiti' : 'Prati ekipu'}
        >
          {followed ? '★' : '☆'}
        </button>
        <div className="font-cond text-xs tracking-[0.18em] uppercase text-black/40">{getDivisionLabel(currentTeam.division)}</div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="font-display text-6xl leading-none truncate" style={currentTeam.color ? { color: currentTeam.color } : undefined}>
              {currentTeam.code}
            </div>
            {currentTeam.displayName && currentTeam.displayName !== currentTeam.code && (
              <div className="text-lg text-black/65 mt-2">{currentTeam.displayName}</div>
            )}
            <div className="text-sm text-black/50 mt-2">Kapetan: {currentTeam.captain || 'nije unesen'}</div>
          </div>
          <div className="text-sm text-black/50">{currentTeam.playersCount} igraca</div>
        </div>
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <Stat label="Pobjede" value={stats.w} />
            <Stat label="Porazi" value={stats.l} />
            <Stat label="Dano" value={stats.gf} />
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
          <h2 className="font-cond font-extrabold text-xs tracking-[0.18em] uppercase text-black/45">Igraci</h2>
          <div className="card p-4">
            <ul className="divide-y divide-black/5">
              {currentTeam.players.map((p, i) => (
                <li key={i} className="py-3 flex items-center justify-between gap-3">
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
