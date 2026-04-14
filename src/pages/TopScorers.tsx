import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAllGoals, useMatches, useTeams } from '../lib/hooks';
import Loading from '../components/Loading';
import { classNames } from '../lib/utils';
import type { Division } from '../lib/types';

type DivFilter = 'all' | Division;

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

    // count goals per (teamId|player) and per match
    const byKey = new Map<string, Map<string, number>>();
    for (const g of goals) {
      if (!g.playerName) continue;
      const key = `${g.teamId}|${g.playerName}`;
      let m = byKey.get(key);
      if (!m) { m = new Map(); byKey.set(key, m); }
      m.set(g.matchId, (m.get(g.matchId) ?? 0) + 1);
    }

    // matches played per team (finished only)
    const mpPerTeam = new Map<string, number>();
    matches.filter((m) => m.status === 'finished').forEach((m) => {
      mpPerTeam.set(m.homeId, (mpPerTeam.get(m.homeId) ?? 0) + 1);
      mpPerTeam.set(m.awayId, (mpPerTeam.get(m.awayId) ?? 0) + 1);
    });

    const out: Row[] = [];
    for (const [key, perMatch] of byKey) {
      const [teamId, player] = key.split('|');
      const team = teamMap.get(teamId);
      if (division !== 'all' && team?.division !== division) continue;
      if (search && !player.toLowerCase().includes(search.toLowerCase())) continue;
      const perMatchCounts = Array.from(perMatch.values());
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
  const hasZenske = teams.some((t) => t.division === 'Ženski');

  return (
    <div>
      <h1 className="font-display text-4xl mb-4 tracking-wide">Strijelci</h1>

      {hasZenske && (
        <div className="flex gap-2 mb-3">
          {([
            ['all', 'Svi'],
            ['Muški', 'Muški'],
            ['Ženski', 'Ženski'],
          ] as [DivFilter, string][]).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setDivision(k)}
              className={classNames(
                'pill transition',
                division === k ? 'bg-brand-dark text-white' : 'bg-black/5 text-black/55 hover:bg-black/10'
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
        placeholder="Pretraži strijelca..."
        className="input mb-5"
      />

      {rows.length === 0 && (
        <div className="card p-6 text-center text-black/50">Još nema golova.</div>
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
              className="flex items-center gap-3 px-4 py-3 hover:bg-black/[0.02] transition"
            >
              <div className={classNames(
                'font-display text-2xl w-7 text-center',
                i === 0 ? 'text-brand-blue' : i === 1 || i === 2 ? 'text-brand-red' : 'text-black/30'
              )}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold flex items-center gap-2">
                  <span className="truncate">{r.player}</span>
                  {hat && (
                    <span className="pill bg-brand-blue/10 text-brand-blue shrink-0" title="Hat-trick">
                      Hat-trick
                    </span>
                  )}
                </div>
                <div className="text-xs text-black/40 font-cond tracking-wider uppercase">
                  {team?.code ?? r.teamId} · {r.matchesPlayed} ut. · {perGame} / ut.
                </div>
              </div>
              <div className="font-display text-2xl text-brand-blue">{r.goals}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
