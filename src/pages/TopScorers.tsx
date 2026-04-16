import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAllGoals, useMatches, useTeams } from '../lib/hooks';
import Loading from '../components/Loading';
import { classNames, getDivisionKey, normalizePersonName } from '../lib/utils';
import type { Team } from '../lib/types';

type DivFilter = 'all' | 'm' | 'z';

interface Row {
  player: string;
  teamId: string;
  goals: number;
  matchesPlayed: number;
  perMatchCounts: number[];
}

const PODIUM: Record<number, { bar: string; text: string; bg: string }> = {
  0: { bar: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-50/70 ring-amber-100' },
  1: { bar: 'bg-zinc-400', text: 'text-zinc-600', bg: 'bg-zinc-50 ring-zinc-200' },
  2: { bar: 'bg-orange-400', text: 'text-orange-600', bg: 'bg-orange-50/70 ring-orange-100' },
};

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
  const totalGoals = rows.reduce((a, r) => a + r.goals, 0);

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

      {rows.length === 0 ? (
        <div className="card p-8 text-center text-black/50">Jos nema golova.</div>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-block w-1 h-4 rounded-full bg-brand-dark" />
            <h2 className="font-cond font-extrabold text-xs tracking-[0.18em] uppercase text-black/55">
              Poredak
            </h2>
            <span className="font-cond text-[11px] font-bold uppercase tracking-[0.14em] rounded-full px-2 py-[1px] bg-brand-blue/10 text-brand-blue">
              {rows.length} {rows.length === 1 ? 'strijelac' : 'strijelaca'}
            </span>
            <span className="ml-auto font-cond text-[11px] font-bold uppercase tracking-[0.14em] text-black/45">
              {totalGoals} golova
            </span>
          </div>

          <div className="card p-2 sm:p-3">
            {(() => {
              const distinctGoals = Array.from(new Set(rows.map((r) => r.goals))).sort((a, b) => b - a);
              const showRanks = distinctGoals.length > 1;
              return rows.map((r) => (
                <ScorerRow
                  key={`${r.teamId}|${r.player}`}
                  row={r}
                  rank={showRanks ? distinctGoals.indexOf(r.goals) : -1}
                  team={teamMap.get(r.teamId)}
                />
              ));
            })()}
          </div>
        </section>
      )}
    </div>
  );
}

function ScorerRow({ row, rank, team }: { row: Row; rank: number; team?: Team }) {
  const hat = Math.max(0, ...row.perMatchCounts) >= 3;
  const perGame = row.matchesPlayed > 0 ? (row.goals / row.matchesPlayed).toFixed(2) : '—';
  const showRank = rank >= 0;
  const podium = showRank ? PODIUM[rank] : undefined;
  const teamColor = team?.color || undefined;

  return (
    <Link
      to={team ? `/ekipe/${row.teamId}` : '#'}
      className={classNames(
        'relative flex items-center gap-3 rounded-xl px-3 py-2.5 mb-[5px] last:mb-0 transition',
        podium ? `${podium.bg} ring-1 ring-inset` : 'hover:bg-black/[0.03]'
      )}
    >
      <span
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ background: teamColor ?? 'rgba(0,0,0,0.06)' }}
      />
      {showRank && (
        <div
          className={classNames(
            'font-display text-2xl w-9 text-center shrink-0 pl-1',
            podium ? podium.text : 'text-black/30'
          )}
        >
          {rank + 1}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[15px] truncate">{row.player}</span>
          {hat && (
            <span
              className="pill border-brand-blue/10 bg-brand-blue/10 text-brand-blue shrink-0"
              title="Hat-trick"
            >
              Hat-trick
            </span>
          )}
        </div>
        <div className="font-cond text-[10px] uppercase tracking-[0.14em] text-black/45 mt-0.5 truncate">
          <span className="font-bold text-black/65" style={teamColor ? { color: teamColor } : undefined}>
            {team?.code ?? row.teamId}
          </span>
          <span className="mx-1.5 text-black/20">·</span>
          {row.matchesPlayed} ut.
          <span className="mx-1.5 text-black/20">·</span>
          {perGame} po ut.
        </div>
      </div>
      <div className="flex items-baseline gap-1 shrink-0">
        <span className="font-display text-3xl leading-none text-brand-blue">{row.goals}</span>
        <span className="font-cond text-[10px] uppercase tracking-[0.14em] text-black/35">gol</span>
      </div>
    </Link>
  );
}
