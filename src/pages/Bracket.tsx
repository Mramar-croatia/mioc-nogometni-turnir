import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SkeletonList } from '../components/Skeleton';
import { useMatches, useTeams, useTournamentMeta } from '../lib/hooks';
import { resolveCurrentStage, STAGE_DISPLAY } from '../lib/utils';
import type { Match, Team } from '../lib/types';
import {
  BRACKET_BLUE as BLUE,
  BRACKET_RED as RED,
  BRANCHES,
  DEFAULT_BYE_TEAM_CODES,
  MATCH_FLOW,
  MATCH_HINTS,
  PLANNED_NUMBERS,
  type BranchId,
  type BranchPlan,
  type ByePlan,
  type RoundPlan,
} from '../lib/bracketPlan';

type ByeTeams = [Team | undefined, Team | undefined, Team | undefined];

export default function Bracket() {
  const matches = useMatches();
  const teams = useTeams();
  const meta = useTournamentMeta();
  const [activeBranch, setActiveBranch] = useState<BranchId>('GG');
  const currentStage = resolveCurrentStage(meta?.currentStage);
  const stageLabel = STAGE_DISPLAY[currentStage] ?? currentStage;

  if (matches === null || teams === null) {
    return (
      <div className="space-y-6">
        <div>
          <div className="font-cond text-xs font-bold uppercase tracking-[0.18em] text-black/45">Struktura</div>
          <h1 className="font-display text-5xl leading-none tracking-[0.04em] mt-2">Pregled faza</h1>
        </div>
        <SkeletonList count={4} />
      </div>
    );
  }

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const matchByNumber = new Map<string, Match>();
  matches.forEach((m) => {
    if (m.matchNumber) matchByNumber.set(m.matchNumber, m);
  });

  const finished = matches.filter((m) => m.status === 'finished').length;
  const live = matches.filter((m) => m.status === 'live').length;
  const byeTeams = getByeTeams(matchByNumber, teamMap);

  const unplanned = matches.filter((m) => !m.matchNumber || !PLANNED_NUMBERS.has(m.matchNumber));

  const branchCount = (b: BranchPlan) => {
    const nums = b.rounds.flatMap((r) => r.numbers);
    const total = nums.length;
    const done = nums.filter((n) => matchByNumber.get(n)?.status === 'finished').length;
    return { total, done };
  };

  const handleTabClick = (id: BranchId) => setActiveBranch(id);

  const visibleBranches = BRANCHES.filter((b) => b.id === activeBranch);

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div>
          <div className="font-cond text-xs font-bold uppercase tracking-[0.18em] text-black/45">Struktura</div>
          <h1 className="font-display text-5xl leading-none tracking-[0.04em] mt-2">Pregled faza</h1>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 items-stretch">
          <SummaryCard label="Odigrano" value={finished} />
          <SummaryCard label="Uživo sada" value={live} />
        </div>

        <div className="rounded-3xl border border-black/5 bg-white px-5 py-5 shadow-card text-center">
          <div className="font-cond text-[10px] font-bold uppercase tracking-[0.18em] text-black/40">
            Aktualna faza
          </div>
          <h2 className="mt-1 font-display text-3xl leading-none tracking-[0.03em] text-brand-dark">
            {stageLabel}
          </h2>
        </div>
      </header>

      <nav className="flex gap-2" aria-label="Grane turnira">
        {BRANCHES.map((b) => {
          const { done, total } = branchCount(b);
          const active = activeBranch === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => handleTabClick(b.id)}
              className="flex-1 min-w-0 rounded-2xl border px-3 py-2.5 text-left transition"
              style={{
                borderColor: active ? b.accent : 'rgba(0,0,0,0.08)',
                background: active ? b.accentTint : '#ffffff',
                color: active ? b.accent : 'rgba(0,0,0,0.55)',
              }}
            >
              <div className="font-cond text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">
                {b.short}
              </div>
              <div className="mt-1 font-display text-lg leading-none truncate">{b.title}</div>
              <div className="mt-1.5 font-cond text-[11px] font-bold uppercase tracking-[0.16em] opacity-80 tabular-nums">
                {done} / {total}
              </div>
            </button>
          );
        })}
      </nav>

      <div className="space-y-10">
        {visibleBranches.map((b) => (
          <BranchSection
            key={b.id}
            branch={b}
            matchByNumber={matchByNumber}
            teamMap={teamMap}
            byeTeams={byeTeams}
          />
        ))}

        {unplanned.length > 0 && (
          <UnplannedSection matches={unplanned} teamMap={teamMap} />
        )}
      </div>
    </div>
  );
}

function BranchSection({
  branch,
  matchByNumber,
  teamMap,
  byeTeams,
}: {
  branch: BranchPlan;
  matchByNumber: Map<string, Match>;
  teamMap: Map<string, Team>;
  byeTeams: ByeTeams;
}) {
  return (
    <section
      id={`grana-${branch.id.toLowerCase()}`}
      data-branch={branch.id}
      className="space-y-6 scroll-mt-24"
    >
      {branch.rounds.map((round, idx) => (
        <RoundBlock
          key={round.title}
          round={round}
          branch={branch}
          matchByNumber={matchByNumber}
          teamMap={teamMap}
          byeTeams={idx === 0 && branch.id === 'GG' ? byeTeams : []}
        />
      ))}
    </section>
  );
}

function RoundBlock({
  round,
  branch,
  matchByNumber,
  teamMap,
  byeTeams,
}: {
  round: RoundPlan;
  branch: BranchPlan;
  matchByNumber: Map<string, Match>;
  teamMap: Map<string, Team>;
  byeTeams: Array<Team | undefined>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3">
        <h3 className="font-cond text-[11px] font-bold uppercase tracking-[0.18em] text-black/55">
          {round.title}
        </h3>
        <div className="h-px flex-1 bg-black/10" />
      </div>

      {round.note && (
        <p className="text-[12.5px] italic leading-relaxed text-black/55">{round.note}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {round.byes?.map((bye, i) => (
          <ByeCard key={bye.id} bye={bye} branch={branch} team={byeTeams[i]} />
        ))}
        {round.numbers.map((number) => (
          <MatchCard
            key={number}
            number={number}
            match={matchByNumber.get(number) ?? null}
            branch={branch}
            teamMap={teamMap}
          />
        ))}
      </div>
    </div>
  );
}

function getByeTeams(matchByNumber: Map<string, Match>, teamMap: Map<string, Team>): ByeTeams {
  const u6Home = matchByNumber.get('U6')?.homeId;
  const u7Away = matchByNumber.get('U7')?.awayId;
  const u8Home = matchByNumber.get('U8')?.homeId;
  const teamByCode = new Map(Array.from(teamMap.values(), (team) => [team.code, team] as const));

  return [
    u6Home ? teamMap.get(u6Home) : teamByCode.get(DEFAULT_BYE_TEAM_CODES[0]),
    u7Away ? teamMap.get(u7Away) : teamByCode.get(DEFAULT_BYE_TEAM_CODES[1]),
    u8Home ? teamMap.get(u8Home) : teamByCode.get(DEFAULT_BYE_TEAM_CODES[2]),
  ];
}

function MatchCard({
  number,
  match,
  branch,
  teamMap,
}: {
  number: string;
  match: Match | null;
  branch: BranchPlan;
  teamMap: Map<string, Team>;
}) {
  const flow = MATCH_FLOW[number] ?? '';
  const hints = MATCH_HINTS[number];
  const home = match ? teamMap.get(match.homeId) : null;
  const away = match ? teamMap.get(match.awayId) : null;
  const homeColor = home?.color || BLUE;
  const awayColor = away?.color || RED;
  const winnerHome = !!match && match.winnerId === match.homeId;
  const winnerAway = !!match && match.winnerId === match.awayId;
  const showScores = !!match && match.status !== 'scheduled';

  const shell =
    'block rounded-2xl border border-black/8 border-l-[4px] bg-white p-3.5 transition';
  const shellStyle = { borderLeftColor: branch.accent };

  const body = (
    <>
      <div className="flex items-start gap-2">
        <span
          className="inline-flex h-7 min-w-[36px] items-center justify-center rounded-full px-2 font-display text-sm text-white tabular-nums shrink-0"
          style={{ background: branch.accent }}
        >
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-base leading-none text-brand-dark">
            Utakmica {number.replace(/^U/, '')}
          </div>
          {flow && (
            <div
              className="mt-1 font-cond text-[10.5px] font-semibold uppercase tracking-[0.14em] leading-snug"
              style={{ color: branch.accent }}
            >
              {flow}
            </div>
          )}
        </div>
        {match && <StatusPill match={match} />}
      </div>

      <div className="mt-3 space-y-2">
        <SlotRow
          hint={hints?.[0]}
          code={home?.code ?? null}
          score={showScores ? match!.homeScore : null}
          color={homeColor}
          winner={winnerHome}
        />
        <SlotRow
          hint={hints?.[1]}
          code={away?.code ?? null}
          score={showScores ? match!.awayScore : null}
          color={awayColor}
          winner={winnerAway}
        />
      </div>

      {match && (
        <div className="mt-3 font-cond text-[11px] uppercase tracking-[0.16em] text-black/40">
          {match.date} / {match.time}
        </div>
      )}
    </>
  );

  if (match) {
    return (
      <Link to={`/utakmice/${match.id}`} className={`${shell} hover:border-black/15`} style={shellStyle}>
        {body}
      </Link>
    );
  }

  return (
    <div className={shell} style={shellStyle} aria-label={`${number} — još nema ekipa`}>
      {body}
    </div>
  );
}

function ByeCard({ bye, branch, team }: { bye: ByePlan; branch: BranchPlan; team?: Team }) {
  const teamColor = team?.color || branch.accent;
  return (
    <div
      className="rounded-2xl border border-black/8 border-l-[4px] bg-white p-3.5"
      style={{ borderLeftColor: branch.accent }}
    >
      <div className="flex items-start gap-2">
        <span
          className="inline-flex h-7 items-center justify-center rounded-full border border-dashed px-2.5 font-cond text-[10px] font-bold uppercase tracking-[0.16em] shrink-0"
          style={{ color: branch.accent, borderColor: branch.accent }}
        >
          BYE
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-display text-base leading-none text-brand-dark">{bye.label}</div>
          <div
            className="mt-1 font-cond text-[10.5px] font-semibold uppercase tracking-[0.14em] leading-snug"
            style={{ color: branch.accent }}
          >
            {bye.flow}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 pl-1 font-cond text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">
          {bye.hint}
        </div>
        <div
          className="flex items-center gap-3 rounded-xl border px-3 py-2"
          style={{
            borderColor: team ? `${branch.accent}28` : 'rgba(0,0,0,0.08)',
            background: team ? `${branch.accent}10` : 'rgba(0,0,0,0.02)',
          }}
        >
          <div
            className="h-6 w-1 shrink-0 rounded-full"
            style={{ background: branch.accent, opacity: team ? 1 : 0.25 }}
          />
          <div
            className="truncate font-display text-xl leading-none"
            style={{ color: team ? teamColor : 'rgba(0,0,0,0.35)' }}
          >
            {team?.code ?? 'Prolaz'}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlotRow({
  hint,
  code,
  score,
  color,
  winner,
}: {
  hint?: string;
  code: string | null;
  score: number | null;
  color: string;
  winner: boolean;
}) {
  const filled = !!code;
  return (
    <div>
      {hint && (
        <div className="mb-1 pl-1 font-cond text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">
          {hint}
        </div>
      )}
      <div
        className="flex items-center gap-3 rounded-xl border px-3 py-2"
        style={{
          borderColor: winner ? `${color}28` : 'rgba(0,0,0,0.08)',
          background: winner ? `${color}10` : filled ? '#fff' : 'rgba(0,0,0,0.02)',
        }}
      >
        <div
          className="h-6 w-1 shrink-0 rounded-full"
          style={{ background: color, opacity: winner ? 1 : filled ? 0.35 : 0.15 }}
        />
        <div
          className="truncate font-display text-xl leading-none"
          style={{ color: winner ? color : filled ? '#13152a' : 'rgba(0,0,0,0.35)' }}
        >
          {code ?? '—'}
        </div>
        <div className="ml-auto font-display text-xl leading-none text-brand-dark">
          {score ?? '—'}
        </div>
      </div>
    </div>
  );
}

function UnplannedSection({ matches, teamMap }: { matches: Match[]; teamMap: Map<string, Team> }) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-3">
        <h3 className="font-cond text-[11px] font-bold uppercase tracking-[0.18em] text-black/55">
          Ostale utakmice
        </h3>
        <div className="h-px flex-1 bg-black/10" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((m) => {
          const home = teamMap.get(m.homeId);
          const away = teamMap.get(m.awayId);
          const homeColor = home?.color || BLUE;
          const awayColor = away?.color || RED;
          const winnerHome = m.winnerId === m.homeId;
          const winnerAway = m.winnerId === m.awayId;
          const showScores = m.status !== 'scheduled';
          return (
            <Link
              key={m.id}
              to={`/utakmice/${m.id}`}
              className="block rounded-2xl border border-black/8 bg-white p-3.5 transition hover:border-black/15"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-display text-base leading-none text-brand-dark">
                    {m.matchNumber || m.bracketSlot || 'Utakmica'}
                  </div>
                </div>
                <StatusPill match={m} />
              </div>
              <div className="mt-3 space-y-2">
                <SlotRow
                  code={home?.code ?? null}
                  score={showScores ? m.homeScore : null}
                  color={homeColor}
                  winner={winnerHome}
                />
                <SlotRow
                  code={away?.code ?? null}
                  score={showScores ? m.awayScore : null}
                  color={awayColor}
                  winner={winnerAway}
                />
              </div>
              <div className="mt-3 font-cond text-[11px] uppercase tracking-[0.16em] text-black/40">
                {m.date} / {m.time}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function StatusPill({ match }: { match: Match }) {
  const text = match.status === 'live' ? 'Uživo' : match.status === 'finished' ? 'Gotovo' : 'Slijedi';
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2 py-1 font-cond text-[9px] font-bold uppercase tracking-[0.16em] shrink-0',
        match.status === 'live'
          ? 'border-brand-red/20 bg-brand-red/10 text-brand-red'
          : match.status === 'finished'
            ? 'border-black/10 bg-black/[0.03] text-black/45'
            : 'border-brand-blue/10 bg-brand-blue/10 text-brand-blue',
      ].join(' ')}
    >
      {text}
    </span>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4 text-center">
      <div className="font-display text-4xl leading-none">{value}</div>
      <div className="mt-2 font-cond text-[10px] uppercase tracking-[0.16em] text-black/40">{label}</div>
    </div>
  );
}
