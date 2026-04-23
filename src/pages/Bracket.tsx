import { useEffect, useId, useState } from 'react';
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
    subtitle: 'Ulaz u završnicu',
    empty: 'Utakmice prvog kola još nisu dodane.',
  },
  {
    stage: 'WB',
    title: 'Pobjednička grana',
    subtitle: 'Put prema finalu bez poraza',
    empty: 'Još nema utakmica pobjedničke grane.',
  },
  {
    stage: 'LB',
    title: 'Poražena grana',
    subtitle: 'Druga šansa za ulazak u finale',
    empty: 'Još nema utakmica poražene grane.',
  },
  {
    stage: 'F',
    title: 'Finale',
    subtitle: 'Pobjednik grana ulazi u završni duel',
    empty: 'Finale još nije dodano.',
  },
];

export default function Bracket() {
  const matches = useMatches();
  const teams = useTeams();
  const isMobile = useMobileBreakpoint();
  const [isRoundOneOpen, setIsRoundOneOpen] = useState(false);

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

  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const stageMap = new Map(
    STAGES.map((item) => [
      item.stage,
      matches.filter((match) => match.stage === item.stage).sort(compareMatchSchedule),
    ])
  );

  const finished = matches.filter((match) => match.status === 'finished').length;
  const live = matches.filter((match) => match.status === 'live').length;
  const winnersFromRoundOne = matches
    .filter((match) => match.stage === 'R1' && match.status === 'finished' && match.winnerId)
    .map((match) => teamMap.get(match.winnerId!))
    .filter((team): team is Team => Boolean(team));

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div>
          <div className="font-cond text-xs font-bold uppercase tracking-[0.18em] text-black/45">Struktura</div>
          <h1 className="font-display text-5xl leading-none tracking-[0.04em] mt-2">Pregled faza</h1>
        </div>

        

        <div className="grid gap-3 sm:grid-cols-3 items-stretch">
          <SummaryCard label="Odigrano" value={finished} />
          <SummaryCard label="Uživo sada" value={live} />
        </div>
        
        
        <div className="rounded-3xl border border-black/5 bg-white px-5 py-5 shadow-card text-center">
            <h2 className="font-display text-3xl leading-none tracking-[0.03em] text-brand-dark">
                Turnir je sada u drugom krugu
            </h2>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-cond text-xs font-extrabold uppercase tracking-[0.18em] text-black/50">Tok turnira</h2>
          <div className="font-cond text-xs uppercase tracking-[0.16em] text-black/35">
            Od početka prema finalu
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                collapsible={item.stage === 'R1'}
                collapsed={item.stage === 'R1' && isMobile && !isRoundOneOpen}
                isMobile={isMobile}
                onToggle={item.stage === 'R1' ? () => setIsRoundOneOpen((open) => !open) : undefined}
              />
            );
          })}
        </div>
      </section>
    </div>
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
  collapsible,
  collapsed,
  isMobile,
  onToggle,
}: {
  index: number;
  stage: Stage;
  title: string;
  subtitle: string;
  empty: string;
  matches: Match[];
  teamMap: Map<string, Team>;
  provisionalTeams: Team[];
  collapsible?: boolean;
  collapsed?: boolean;
  isMobile?: boolean;
  onToggle?: () => void;
}) {
  const finished = matches.filter((match) => match.status === 'finished').length;
  const contentId = useId();

  return (
    <section className="card flex flex-col p-4">
      {collapsible && isMobile ? (
        <button
          type="button"
          className="flex w-full items-start justify-between gap-3 text-left"
          aria-expanded={!collapsed}
          aria-controls={contentId}
          onClick={onToggle}
        >
          <StagePanelHeading
            index={index}
            title={title}
            subtitle={subtitle}
            finished={finished}
            total={matches.length}
            collapsed={collapsed}
            showChevron
          />
        </button>
      ) : (
        <StagePanelHeading
          index={index}
          title={title}
          subtitle={subtitle}
          finished={finished}
          total={matches.length}
        />
      )}

      {!collapsed && (
        <div id={contentId}>
          <div className="mb-3 mt-4 h-px bg-black/8" />

          {matches.length === 0 ? (
            stage === 'WB' && provisionalTeams.length > 0 ? (
              <div className="space-y-2">
                <div className="text-center font-cond text-[11px] uppercase tracking-[0.16em] text-black/40">
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
                      <div className="mt-1 truncate text-xs text-black/45">{team.displayName}</div>
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
        </div>
      )}
    </section>
  );
}

function StagePanelHeading({
  index,
  title,
  subtitle,
  finished,
  total,
  collapsed,
  showChevron,
}: {
  index: number;
  title: string;
  subtitle: string;
  finished: number;
  total: number;
  collapsed?: boolean;
  showChevron?: boolean;
}) {
  return (
    <>
      <div>
        <div className="font-cond text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">
          Faza {index + 1}
        </div>
        <h3 className="mt-2 font-display text-3xl leading-none">{title}</h3>
        <p className="mt-2 text-sm text-black/50">{subtitle}</p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <div className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-cond font-bold uppercase tracking-[0.16em] text-black/45">
          {finished}/{total || 0}
        </div>
        {showChevron && (
          <span
            className={[
              'flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-black/[0.03] text-black/45 transition-transform',
              collapsed ? '' : 'rotate-180',
            ].join(' ')}
            aria-hidden="true"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        )}
      </div>
    </>
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

      <div className="mt-3 font-cond text-[11px] uppercase tracking-[0.16em] text-black/40">
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
      <div className="h-7 w-1 shrink-0 rounded-full" style={{ background: color, opacity: winner ? 1 : 0.25 }} />
      <div className="truncate font-display text-2xl leading-none" style={{ color: winner ? color : '#13152a' }}>
        {code}
      </div>
      <div className="ml-auto font-display text-2xl leading-none text-brand-dark">{score ?? '—'}</div>
    </div>
  );
}

function StatusPill({ match, compact }: { match: Match; compact?: boolean }) {
  const text =
    match.status === 'live'
      ? 'Uživo'
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
      <div className="mt-2 font-cond text-[10px] uppercase tracking-[0.16em] text-black/40">{label}</div>
    </div>
  );
}

function EmptyState({ text, compact }: { text: string; compact?: boolean }) {
  return (
    <div className={compact ? 'rounded-xl bg-black/[0.02] px-3 py-4 text-center text-sm text-black/45' : 'card p-6 text-center text-black/50'}>
      {text}
    </div>
  );
}

function useMobileBreakpoint() {
  const getMatches = () => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(max-width: 639px)').matches;
  };

  const [isMobile, setIsMobile] = useState(getMatches);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;

    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', onChange);

    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
