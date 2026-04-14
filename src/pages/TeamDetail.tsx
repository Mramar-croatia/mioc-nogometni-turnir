import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAllGoals, useMatches, useTeam, useTeams } from '../lib/hooks';
import { useFollowedTeams } from '../lib/favorites';
import { buildIcs, downloadIcs } from '../lib/ics';
import MatchCard from '../components/MatchCard';
import TeamCrest from '../components/TeamCrest';
import Loading from '../components/Loading';
import { classNames } from '../lib/utils';

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
    let gf = 0, ga = 0, w = 0, l = 0;
    for (const m of played) {
      const isHome = m.homeId === id;
      const scoredFor = isHome ? m.homeScore : m.awayScore;
      const scoredAgainst = isHome ? m.awayScore : m.homeScore;
      gf += scoredFor; ga += scoredAgainst;
      if (m.winnerId === id) w += 1; else l += 1;
    }
    return { matches, played, upcoming: matches.filter((m) => m.status !== 'finished'), gf, ga, w, l };
  }, [allMatches, id]);

  const teamScorers = useMemo(() => {
    if (!allGoals || !id) return [];
    const map = new Map<string, number>();
    for (const g of allGoals) {
      if (g.teamId !== id) continue;
      map.set(g.playerName, (map.get(g.playerName) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [allGoals, id]);

  if (team === undefined || allMatches === null || allTeams === null) return <Loading />;
  if (team === null) return <div className="text-center py-10">Ekipa nije pronađena.</div>;

  const teamMap = new Map(allTeams.map((t) => [t.id, t]));
  const followed = isFollowed(team.id);

  function exportTeamIcs() {
    if (!stats) return;
    downloadIcs(`${team!.code}-raspored.ics`,
      buildIcs(stats.matches, teamMap, `${team!.code} — raspored`));
  }

  return (
    <div>
      <Link to="/ekipe" className="font-cond text-xs tracking-widest uppercase text-black/40 mb-3 inline-block">
        ← Sve ekipe
      </Link>

      <div
        className="card p-6 mb-5 relative overflow-hidden"
        style={team.color ? {
          background: `linear-gradient(135deg, ${team.color}12 0%, #fff 60%)`,
        } : undefined}
      >
        {team.color && (
          <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: team.color }} />
        )}
        <button
          onClick={() => toggle(team.id)}
          className={classNames(
            'absolute top-3 right-3 w-10 h-10 grid place-items-center rounded-full text-2xl transition',
            followed ? 'text-brand-blue' : 'text-black/20 hover:text-black/50'
          )}
          aria-label={followed ? 'Prestani pratiti' : 'Prati ekipu'}
        >
          {followed ? '★' : '☆'}
        </button>
        <div className="font-cond text-xs tracking-widest uppercase text-black/40">{team.division}</div>
        <div className="flex items-center gap-4 pr-10 mt-1">
          <TeamCrest team={team} size={80} rounded="lg" />
          <div className="min-w-0">
            <div
              className="font-display text-5xl truncate"
              style={team.color ? { color: team.color } : undefined}
            >
              {team.code}
            </div>
            <div className="text-sm text-black/50 mt-1">Kapetan: {team.captain}</div>
          </div>
        </div>
        {stats && (
          <div className="grid grid-cols-4 gap-3 mt-5">
            <Stat label="Pobjede" value={stats.w} />
            <Stat label="Porazi" value={stats.l} />
            <Stat label="Dano" value={stats.gf} />
            <Stat label="Primljeno" value={stats.ga} />
          </div>
        )}
        {stats && stats.matches.length > 0 && (
          <button onClick={exportTeamIcs} className="btn-ghost w-full mt-4">
            + Dodaj raspored u kalendar
          </button>
        )}
      </div>

      {teamScorers.length > 0 && (
        <>
          <h2 className="font-cond font-extrabold text-xs tracking-widest uppercase text-black/45 mb-3">Strijelci ekipe</h2>
          <div className="card divide-y divide-black/5 mb-7">
            {teamScorers.map(([name, n]) => (
              <div key={name} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex-1 font-medium truncate">{name}</span>
                <span className="font-display text-lg text-brand-blue">{n}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="font-cond font-extrabold text-xs tracking-widest uppercase text-black/45 mb-3">Igrači</h2>
      <div className="card p-4 mb-7">
        <ul className="divide-y divide-black/5">
          {team.players.map((p, i) => (
            <li key={i} className="py-2 flex items-center justify-between">
              <span className="font-medium">{p.name}</span>
              {p.is_captain && <span className="pill bg-brand-blue/10 text-brand-blue">Kapetan</span>}
            </li>
          ))}
        </ul>
      </div>

      {stats && stats.upcoming.length > 0 && (
        <>
          <h2 className="font-cond font-extrabold text-xs tracking-widest uppercase text-black/45 mb-3">Predstojeće</h2>
          {stats.upcoming.map((m, i) => (
            <MatchCard key={m.id} match={m} home={teamMap.get(m.homeId)} away={teamMap.get(m.awayId)} index={i} compact />
          ))}
        </>
      )}

      {stats && stats.played.length > 0 && (
        <>
          <h2 className="font-cond font-extrabold text-xs tracking-widest uppercase text-black/45 mb-3 mt-4">Odigrane</h2>
          {stats.played.map((m, i) => (
            <MatchCard key={m.id} match={m} home={teamMap.get(m.homeId)} away={teamMap.get(m.awayId)} index={i} compact />
          ))}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="font-display text-3xl leading-none">{value}</div>
      <div className="font-cond text-[10px] uppercase tracking-widest text-black/40 mt-1">{label}</div>
    </div>
  );
}
