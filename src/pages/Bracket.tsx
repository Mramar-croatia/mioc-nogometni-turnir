import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SkeletonList } from '../components/Skeleton';
import { useMatches, useTeams } from '../lib/hooks';
import type { Match, Team } from '../lib/types';

const BLUE = '#1d4e9e';
const RED = '#d42a3c';
const DARK = '#13152a';

type BranchId = 'GG' | 'DG' | 'VF';

interface ByePlan {
  id: string;
  label: string;
  hint: string;
  flow: string;
}

interface RoundPlan {
  title: string;
  numbers: string[];
  note?: string;
  byes?: ByePlan[];
}

interface BranchPlan {
  id: BranchId;
  title: string;
  short: string;
  subtitle: string;
  accent: string;
  accentTint: string;
  rounds: RoundPlan[];
}

const MATCH_FLOW: Record<string, string> = {
  U1: 'Pobj. → U6 · Gub. → U12',
  U2: 'Pobj. → U7 · Gub. → U13',
  U3: 'Pobj. → U9 · Gub. → U10',
  U4: 'Pobj. → U9 · Gub. → U10',
  U5: 'Pobj. → U8 · Gub. → U11',
  U6: 'Pobj. → U15 · Gub. → U11',
  U7: 'Pobj. → U15 · Gub. → U14',
  U8: 'Pobj. → U16 · Gub. → U12',
  U9: 'Pobj. → U16 · Gub. → U13',
  U10: 'Pobj. → U14',
  U11: 'Pobj. → U17',
  U12: 'Pobj. → U17',
  U13: 'Pobj. → U18',
  U14: 'Pobj. → U18',
  U15: 'Pobj. → U21 · Gub. → U20',
  U16: 'Pobj. → U21 · Gub. → U19',
  U17: 'Pobj. → U19',
  U18: 'Pobj. → U20',
  U19: 'Pobj. → U22',
  U20: 'Pobj. → U22',
  U21: 'Pobj. → U24 · Gub. → U23',
  U22: 'Pobj. → U23',
  U23: 'Pobj. → U24 (veliko finale)',
  U24: 'Ako DG pobijedi → U25',
  U25: 'Pobjednik = prvak turnira',
};

const MATCH_HINTS: Record<string, [string, string]> = {
  U6: ['Prolaz 1', 'Pobj. U1'],
  U7: ['Pobj. U2', 'Prolaz 2'],
  U8: ['Prolaz 3', 'Pobj. U5'],
  U9: ['Pobj. U3', 'Pobj. U4'],
  U10: ['Gubitnik U3', 'Gubitnik U4'],
  U11: ['Gubitnik U5', 'Gubitnik U6'],
  U12: ['Gubitnik U1', 'Gubitnik U8'],
  U13: ['Gubitnik U2', 'Gubitnik U9'],
  U14: ['Gubitnik U7', 'Pobj. U10'],
  U15: ['Pobj. U6', 'Pobj. U7'],
  U16: ['Pobj. U9', 'Pobj. U8'],
  U17: ['Pobj. U11', 'Pobj. U12'],
  U18: ['Pobj. U13', 'Pobj. U14'],
  U19: ['Gubitnik U16', 'Pobj. U17'],
  U20: ['Pobj. U18', 'Gubitnik U15'],
  U21: ['Pobj. U15', 'Pobj. U16'],
  U22: ['Pobj. U19', 'Pobj. U20'],
  U23: ['Gubitnik U21', 'Pobj. U22'],
  U24: ['Pobjednik GG (U21)', 'Pobjednik DG (U23)'],
  U25: ['Pobjednik GG (U21)', 'Pobjednik DG (U23)'],
};

const BRANCHES: BranchPlan[] = [
  {
    id: 'GG',
    title: 'Pobjednička grana',
    short: 'GG',
    subtitle: 'Put prema finalu bez poraza',
    accent: BLUE,
    accentTint: 'rgba(29,78,158,0.08)',
    rounds: [
      {
        title: '1. krug',
        numbers: ['U1', 'U2', 'U3', 'U4', 'U5'],
        byes: [
          { id: 'bye-1', label: 'Prolaz 1', hint: 'Prva slobodna momčad', flow: 'Ide u U6' },
          { id: 'bye-2', label: 'Prolaz 2', hint: 'Druga slobodna momčad', flow: 'Ide u U7' },
          { id: 'bye-3', label: 'Prolaz 3', hint: 'Treća slobodna momčad', flow: 'Ide u U8' },
        ],
      },
      { title: 'Četvrtfinale GG', numbers: ['U6', 'U7', 'U8', 'U9'] },
      { title: 'Polufinale GG', numbers: ['U15', 'U16'] },
      { title: 'Finale gornje grane', numbers: ['U21'] },
    ],
  },
  {
    id: 'DG',
    title: 'Gubitnička grana',
    short: 'DG',
    subtitle: 'Druga šansa do finala',
    accent: RED,
    accentTint: 'rgba(212,42,60,0.08)',
    rounds: [
      { title: '1. krug DG', numbers: ['U10', 'U11', 'U12', 'U13'] },
      { title: '2. krug DG', numbers: ['U14'] },
      { title: '3. krug DG', numbers: ['U17', 'U18'] },
      { title: '4. krug DG', numbers: ['U19', 'U20'] },
      { title: 'Polufinale DG', numbers: ['U22'] },
      { title: 'Finale donje grane', numbers: ['U23'] },
    ],
  },
  {
    id: 'VF',
    title: 'Veliko finale',
    short: 'VF',
    subtitle: 'Završni duel dviju grana',
    accent: DARK,
    accentTint: 'rgba(19,21,42,0.08)',
    rounds: [
      { title: 'Veliko finale', numbers: ['U24'] },
      {
        title: 'Reset finala',
        numbers: ['U25'],
        note: 'Igra se samo ako pobjednik donje grane pobijedi u U24 — dvostruka eliminacija zahtijeva dva poraza prvaka.',
      },
    ],
  },
];

const PLANNED_NUMBERS = new Set(BRANCHES.flatMap((b) => b.rounds.flatMap((r) => r.numbers)));

export default function Bracket() {
  const matches = useMatches();
  const teams = useTeams();
  const [activeBranch, setActiveBranch] = useState<BranchId>('GG');

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

  const r1Winners = matches
    .filter((m) => m.stage === 'R1' && m.status === 'finished' && m.winnerId)
    .map((m) => teamMap.get(m.winnerId!))
    .filter((t): t is Team => Boolean(t));

  const unplanned = matches.filter((m) => !m.matchNumber || !PLANNED_NUMBERS.has(m.matchNumber));

  const branchCount = (b: BranchPlan) => {
    const nums = b.rounds.flatMap((r) => r.numbers);
    const total = nums.length;
    const done = nums.filter((n) => matchByNumber.get(n)?.status === 'finished').length;
    return { total, done };
  };

  const handleTabClick = (id: BranchId) => {
    setActiveBranch(id);
    const el = document.getElementById(`grana-${id.toLowerCase()}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
          <h2 className="font-display text-3xl leading-none tracking-[0.03em] text-brand-dark">
            Turnir je sada u drugom krugu
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
        {BRANCHES.map((b) => (
          <BranchSection
            key={b.id}
            branch={b}
            matchByNumber={matchByNumber}
            teamMap={teamMap}
            r1Winners={r1Winners}
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
  r1Winners,
}: {
  branch: BranchPlan;
  matchByNumber: Map<string, Match>;
  teamMap: Map<string, Team>;
  r1Winners: Team[];
}) {
  const counts = useMemo(() => {
    const nums = branch.rounds.flatMap((r) => r.numbers);
    const done = nums.filter((n) => matchByNumber.get(n)?.status === 'finished').length;
    return { total: nums.length, done };
  }, [branch, matchByNumber]);

  return (
    <section
      id={`grana-${branch.id.toLowerCase()}`}
      data-branch={branch.id}
      className="space-y-5 scroll-mt-24"
    >
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{ background: branch.accentTint, color: branch.accent }}
      >
        <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: branch.accent }} />
        <div className="min-w-0">
          <h2 className="font-cond text-xs font-extrabold uppercase tracking-[0.18em] truncate">
            {branch.title}
          </h2>
          <p className="font-cond text-[11px] font-semibold tracking-[0.12em] opacity-70 truncate">
            {branch.subtitle}
          </p>
        </div>
        <span className="ml-auto font-cond text-[11px] font-bold tracking-[0.16em] tabular-nums shrink-0">
          {counts.done} / {counts.total}
        </span>
      </div>

      <div className="space-y-6">
        {branch.rounds.map((round, idx) => (
          <RoundBlock
            key={round.title}
            round={round}
            branch={branch}
            matchByNumber={matchByNumber}
            teamMap={teamMap}
            byeTeams={idx === 0 && branch.id === 'GG' ? r1Winners : []}
          />
        ))}
      </div>
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
  byeTeams: Team[];
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
              className="mt-1 font-cond text-[10.5px] font-semibold uppercase tracking-[0.14em] truncate"
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
            className="mt-1 font-cond text-[10.5px] font-semibold uppercase tracking-[0.14em] truncate"
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
