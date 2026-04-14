import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAllGoals, useMatches, useTeams } from '../lib/hooks';
import Loading from '../components/Loading';
import { classNames, getDivisionKey, normalizePersonName } from '../lib/utils';

type DivFilter = 'all' | 'm' | 'z';

interface Row {
  player: string;
  teamId: string;
  goals: number;
  matchesPlayed: number;
  perMatchCounts: number[];
}

export default function TopScorers() {
  const teams = useTeams();
  const matches = useMatches();
  const goals = useAllGoals(matches);
  const [division, setDivision] = useState<DivFilter>('all');
  const [search, setSearch] = useState('');

  const rows = useMemo<Row[]>(() => {
    if (!goals || !teams || !matches) return [];
    const teamMap = new Map(teams.map((t) => [t.id, t]));
    const searchTerm = normalizePersonName(search);

    const byKey = new Map<string, { player: string; perMatch: Map<string, number> }>();
    for (const g of goals) {
      if (!g.playerName) continue;
      const player = g.playerName.trim().replace(/\s+/g, ' ');
      const key = `${g.teamId}|${normalizePersonName(player)}`;
      let entry = byKey.get(key);
      if (!entry) {
        entry = { player, perMatch: new Map() };
        byKey.set(key, entry);
      }
      if (player.length > entry.player.length) entry.player = player;
      entry.perMatch.set(g.matchId, (entry.perMatch.get(g.matchId) ?? 0) + 1);
    }

    const mpPerTeam = new Map<string, number>();
    matches.filter((m) => m.status === 'finished').forEach((m) => {
      mpPerTeam.set(m.homeId, (mpPerTeam.get(m.homeId) ?? 0) + 1);
      mpPerTeam.set(m.awayId, (mpPerTeam.get(m.awayId) ?? 0) + 1);
    });

    const out: Row[] = [];
    for (const [key, entry] of byKey) {
      const [teamId] = key.split('|');
      const player = entry.player;
      const team = teamMap.get(teamId);
      if (division !== 'all' && getDivisionKey(team?.division) !== division) continue;
      if (searchTerm && !normalizePersonName(player).includes(searchTerm)) continue;
      const perMatchCounts = Array.from(entry.perMatch.values());
      const total = perMatchCounts.reduce((a, b) => a + b, 0);
      out.push({
        player,
        teamId,
        goals: total,
        matchesPlayed: mpPerTeam.get(teamId) ?? 0,
        perMatchCounts,
      });
    }
    return out.sort((a, b) => b.goals - a.goals || a.player.localeCompare(b.player, 'hr'));
  }, [goals, teams, matches, division, search]);

  if (goals === null || teams === null || matches === null) return <Loading />;

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const hasZenske = teams.some((t) => getDivisionKey(t.division) === 'z');

  return (
    <div className="space-y-6">
      <header>
        <div className="font-cond text-xs font-bold uppercase tracking-[0.18em] text-black/45">Statistika</div>
        <h1 className="font-display text-5xl leading-none tracking-[0.04em] mt-2">Strijelci</h1>
        <p className="text-black/55 mt-3">Pregled svih strijelaca turnira.</p>
      </header>

      {hasZenske && (
        <div className="flex flex-wrap gap-2">
          {([
            ['all', 'Svi'],
            ['m', 'Muski'],
            ['z', 'Zenski'],
          ] as [DivFilter, string][]).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setDivision(k)}
              className={classNames(
                'pill transition',
                division === k ? 'border-brand-dark bg-brand-dark text-white' : 'text-black/55 hover:border-black/15'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Pretrazi strijelca..."
        className="input"
      />

      {rows.length === 0 && (
        <div className="card p-8 text-center text-black/50">Jos nema golova.</div>
      )}

      <div className="card divide-y divide-black/5">
        {rows.map((r, i) => {
          const team = teamMap.get(r.teamId);
          const hat = Math.max(0, ...r.perMatchCounts) >= 3;
          const perGame = r.matchesPlayed > 0 ? (r.goals / r.matchesPlayed).toFixed(2) : '—';
          return (
            <Link
              key={`${r.teamId}|${r.player}`}
              to={team ? `/ekipe/${r.teamId}` : '#'}
              className="flex items-center gap-4 px-4 py-3 hover:bg-black/[0.02] transition"
            >
              <div className={classNames(
                'font-display text-2xl w-8 text-center',
                i === 0 || i === 2 ? 'text-brand-blue' : i === 1 ? 'text-brand-red' : 'text-black/30'
              )}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold flex items-center gap-2">
                  <span className="truncate">{r.player}</span>
                  {hat && (
                    <span className="pill border-brand-blue/10 bg-brand-blue/10 text-brand-blue shrink-0" title="Hat-trick">
                      Hat-trick
                    </span>
                  )}
                </div>
                <div className="text-xs text-black/40 font-cond tracking-[0.16em] uppercase">
                  {team?.code ?? r.teamId} / {r.matchesPlayed} ut. / {perGame} po utakmici
                </div>
              </div>
              <div className="font-display text-3xl text-brand-blue">{r.goals}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
