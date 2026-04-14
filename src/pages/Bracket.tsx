import { Link } from 'react-router-dom';
import { SkeletonList } from '../components/Skeleton';
import { useMatches, useTeams } from '../lib/hooks';
import { compareMatchSchedule, STAGE_LABEL } from '../lib/utils';
import type { Match, Stage, Team } from '../lib/types';

const BLUE = '#1d4e9e';
const RED = '#d42a3c';

const STAGES: Array<{
  stage: Stage;
  title: string;
  subtitle: string;
  empty: string;
}> = [
  {
    stage: 'R1',
    title: '1. kolo',
    subtitle: 'Ulaz u zavrsnicu',
    empty: 'Utakmice prvog kola jos nisu dodane.',
  },
  {
    stage: 'WB',
    title: 'Pobjednicka grana',
    subtitle: 'Put prema finalu bez poraza',
    empty: 'Jos nema utakmica pobjednicke grane.',
  },
  {
    stage: 'LB',
    title: 'Porazena grana',
    subtitle: 'Druga sansa za ulazak u finale',
    empty: 'Jos nema utakmica porazene grane.',
  },
  {
    stage: 'F',
    title: 'Finale',
    subtitle: 'Pobjednik grana ulazi u zavrsni duel',
    empty: 'Finale jos nije dodano.',
  },
  {
    stage: 'GF',
    title: 'Veliko finale',
    subtitle: 'Posljednja utakmica turnira',
    empty: 'Veliko finale jos nije dodano.',
  },
];

export default function Bracket() {
  const matches = useMatches();
  const teams = useTeams();

  if (matches === null || teams === null) {
    return (
      <div className="space-y-6">
        <div>
          <div className="font-cond text-xs font-bold uppercase tracking-[0.18em] text-black/45">Zavrsnica</div>
          <h1 className="font-display text-5xl leading-none tracking-[0.04em] mt-2">Pregled faza</h1>
        </div>
        <SkeletonList count={4} />
      </div>
    );
  }

  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const stageMap = new Map(
    STAGES.map((item) => [
      item.stage,
      matches.filter((match) => match.stage === item.stage).sort(compareMatchSchedule),
    ])
  );

  const total = matches.length;
  const finished = matches.filter((match) => match.status === 'finished').length;
  const live = matches.filter((match) => match.status === 'live').length;
  const spotlight = pickSpotlightMatch(matches);
  const winnersFromRoundOne = matches
    .filter((match) => match.stage === 'R1' && match.status === 'finished' && match.winnerId)
    .map((match) => teamMap.get(match.winnerId!))
    .filter((team): team is Team => Boolean(team));

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div>
          <div className="font-cond text-xs font-bold uppercase tracking-[0.18em] text-black/45">Zavrsnica</div>
          <h1 className="font-display text-5xl leading-none tracking-[0.04em] mt-2">Pregled faza</h1>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Ukupno utakmica" value={total} />
          <SummaryCard label="Odigrano" value={finished} />
          <SummaryCard label="Uzivo sada" value={live} />
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-cond font-extrabold text-xs tracking-[0.18em] uppercase text-black/50">Tok turnira</h2>
          <div className="text-xs text-black/35 font-cond uppercase tracking-[0.16em]">
            Od pocetka prema finalu
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-5 lg:grid-cols-3 sm:grid-cols-2">
          {STAGES.map((item, index) => {
            const list = stageMap.get(item.stage) ?? [];
            return (
              <StagePanel
                key={item.stage}
                index={index}
                stage={item.stage}
                title={item.title}
                subtitle={item.subtitle}
                empty={item.empty}
                matches={list}
                teamMap={teamMap}
                provisionalTeams={item.stage === 'WB' ? winnersFromRoundOne : []}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

function pickSpotlightMatch(matches: Match[]): Match | null {
  const sorted = [...matches].sort(compareMatchSchedule);
  const finals = sorted.filter((match) => match.stage === 'GF' || match.stage === 'F');
  const pool = finals.length > 0 ? finals : sorted;

  return (
    pool.find((match) => match.status === 'live') ??
    pool.find((match) => match.status === 'scheduled') ??
    [...pool].reverse().find((match) => match.status === 'finished') ??
    null
  );
}

function StagePanel({
  index,
  stage,
  title,
  subtitle,
  empty,
  matches,
  teamMap,
  provisionalTeams,
}: {
  index: number;
  stage: Stage;
  title: string;
  subtitle: string;
  empty: string;
  matches: Match[];
  teamMap: Map<string, Team>;
  provisionalTeams: Team[];
}) {
  const finished = matches.filter((match) => match.status === 'finished').length;

  return (
    <section className="card p-4 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-cond text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">
            Faza {index + 1}
          </div>
          <h3 className="font-display text-3xl leading-none mt-2">{title}</h3>
          <p className="text-sm text-black/50 mt-2">{subtitle}</p>
        </div>
        <div className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-cond font-bold uppercase tracking-[0.16em] text-black/45">
          {finished}/{matches.length || 0}
        </div>
      </div>

      <div className="mt-4 mb-3 h-px bg-black/8" />

      {matches.length === 0 ? (
        stage === 'WB' && provisionalTeams.length > 0 ? (
          <div className="space-y-2">
            <div className="text-[11px] text-black/40 font-cond uppercase tracking-[0.16em] text-center">
              Trenutno prolaze
            </div>
            {provisionalTeams.map((team) => (
              <div
                key={team.id}
                className="rounded-xl border border-black/8 bg-black/[0.02] px-3 py-3 text-center"
              >
                <div
                  className="font-display text-2xl leading-none"
                  style={team.color ? { color: team.color } : undefined}
                >
                  {team.code}
                </div>
                {team.displayName && team.displayName !== team.code && (
                  <div className="text-xs text-black/45 mt-1 truncate">{team.displayName}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text={empty} compact />
        )
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <StageMatchCard key={match.id} match={match} teamMap={teamMap} stage={stage} />
          ))}
        </div>
      )}
    </section>
  );
}

function StageMatchCard({
  match,
  teamMap,
  stage,
}: {
  match: Match;
  teamMap: Map<string, Team>;
  stage: Stage;
}) {
  const home = teamMap.get(match.homeId);
  const away = teamMap.get(match.awayId);
  const homeColor = home?.color || BLUE;
  const awayColor = away?.color || RED;
  const winnerHome = match.winnerId === match.homeId;
  const winnerAway = match.winnerId === match.awayId;

  return (
    <Link
      to={`/utakmice/${match.id}`}
      className="block rounded-2xl border border-black/8 bg-white p-3 transition hover:border-black/15"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-cond text-[10px] font-bold uppercase tracking-[0.16em] text-black/35">
          {match.bracketSlot || STAGE_LABEL[stage]}
        </div>
        <StatusPill match={match} compact />
      </div>

      <div className="mt-3 space-y-2">
        <MiniSide
          code={home?.code ?? '?'}
          score={match.status === 'scheduled' ? null : match.homeScore}
          color={homeColor}
          winner={winnerHome}
        />
        <MiniSide
          code={away?.code ?? '?'}
          score={match.status === 'scheduled' ? null : match.awayScore}
          color={awayColor}
          winner={winnerAway}
        />
      </div>

      <div className="mt-3 text-[11px] text-black/40 font-cond uppercase tracking-[0.16em]">
        {match.date} / {match.time}
      </div>
    </Link>
  );
}

function MiniSide({
  code,
  score,
  color,
  winner,
}: {
  code: string;
  score: number | null;
  color: string;
  winner: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-3 py-2"
      style={{
        borderColor: winner ? `${color}28` : 'rgba(0,0,0,0.06)',
        background: winner ? `${color}10` : '#fff',
      }}
    >
      <div className="h-7 w-1 rounded-full shrink-0" style={{ background: color, opacity: winner ? 1 : 0.25 }} />
      <div className="font-display text-2xl leading-none truncate" style={{ color: winner ? color : '#13152a' }}>
        {code}
      </div>
      <div className="ml-auto font-display text-2xl leading-none text-brand-dark">
        {score ?? '—'}
      </div>
    </div>
  );
}

function SpotlightSide({
  team,
  winner,
  align = 'left',
}: {
  team?: Team;
  winner: boolean;
  align?: 'left' | 'right';
}) {
  const color = team?.color || (align === 'left' ? BLUE : RED);
  return (
    <div
      className="rounded-2xl border px-4 py-4 min-w-0 text-center"
      style={{
        borderColor: winner ? `${color}28` : 'rgba(0,0,0,0.06)',
        background: winner ? `${color}10` : '#fff',
      }}
    >
      <div className="font-cond text-[10px] uppercase tracking-[0.18em] text-black/35">
        {align === 'left' ? 'Domaci' : 'Gosti'}
      </div>
      <div className="font-display text-5xl leading-none mt-2 truncate" style={{ color: winner ? color : '#13152a' }}>
        {team?.code ?? '?'}
      </div>
    </div>
  );
}

function StatusPill({ match, compact }: { match: Match; compact?: boolean }) {
  const text =
    match.status === 'live'
      ? 'Uzivo'
      : match.status === 'finished'
        ? 'Gotovo'
        : 'Slijedi';

  return (
    <span
      className={[
        'inline-flex items-center rounded-full border font-cond font-bold uppercase tracking-[0.16em]',
        compact ? 'px-2 py-1 text-[9px]' : 'px-3 py-1 text-[10px]',
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
      <div className="font-cond text-[10px] uppercase tracking-[0.16em] text-black/40 mt-2">{label}</div>
    </div>
  );
}

function EmptyState({ text, compact }: { text: string; compact?: boolean }) {
  return (
    <div className={compact ? 'rounded-xl bg-black/[0.02] px-3 py-4 text-sm text-center text-black/45' : 'card p-6 text-center text-black/50'}>
      {text}
    </div>
  );
}
