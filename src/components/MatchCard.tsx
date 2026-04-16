import { Link } from 'react-router-dom';
import type { Match, Team, Goal } from '../lib/types';
import GoalTimeline from './GoalTimeline';
import { classNames, shortDateHr, dayLabelShort } from '../lib/utils';
import { useMatchClock } from '../lib/matchClock';

interface Props {
  match: Match;
  home?: Team;
  away?: Team;
  goals?: Goal[];
  index?: number;
  compact?: boolean;
  linkable?: boolean;
}

const BLUE = '#1d4e9e';
const RED = '#d42a3c';

export default function MatchCard({ match, home, away, goals = [], index = 0, compact, linkable = true }: Props) {
  const hasGoals = goals.length > 0 && match.status !== 'scheduled';
  const hasPen = !!match.penalties;
  const finished = match.status === 'finished';
  const live = match.status === 'live';
  const winnerHome = finished && match.winnerId === match.homeId;
  const winnerAway = finished && match.winnerId === match.awayId;

  const homeColor = home?.color || BLUE;
  const awayColor = away?.color || RED;

  const {
    displayTime: clockTime,
    phase: clockPhase,
    phaseLabel: clockPhaseLabel,
    running: clockRunning,
  } = useMatchClock(match);

  const showLiveBanner = live && clockPhase !== 'pre';
  const liveClockText = clockPhase === 'HT' ? '—' : clockTime;

  const statusLabel =
    live ? 'UZIVO'
      : finished ? (hasPen ? 'PENALI' : 'KRAJ')
      : `${dayLabelShort(match.date)} ${shortDateHr(match.date)}`;

  const homeCode = home?.code ?? match.homeId;
  const awayCode = away?.code ?? match.awayId;

  const banner = showLiveBanner ? (
    <div
      className={classNames(
        'card overflow-hidden',
        clockPhase === 'HT' ? 'bg-brand-blue/10' : 'bg-brand-red/10',
      )}
    >
      <div className={classNames('h-1', clockPhase === 'HT' ? 'bg-brand-blue' : 'bg-brand-red')} />
      <div className="px-5 py-4 flex items-center gap-4">
        <span className="relative inline-flex w-3 h-3 shrink-0">
          {clockRunning && (
            <span className={classNames(
              'absolute inline-flex w-full h-full rounded-full animate-livePulse opacity-70',
              clockPhase === 'HT' ? 'bg-brand-blue' : 'bg-brand-red',
            )} />
          )}
          <span className={classNames(
            'relative inline-flex w-3 h-3 rounded-full',
            clockPhase === 'HT' ? 'bg-brand-blue' : 'bg-brand-red',
          )} />
        </span>
        <div className="flex flex-col leading-tight min-w-0">
          <span className={classNames(
            'font-cond text-[11px] font-bold uppercase tracking-[0.2em]',
            clockPhase === 'HT' ? 'text-brand-blue' : 'text-brand-red',
          )}>
            {clockPhase === 'HT' ? 'Poluvrijeme' : 'Uživo'}
          </span>
          <span className="font-cond text-sm font-semibold text-black/55 uppercase tracking-[0.14em]">
            {clockPhaseLabel}
            {!clockRunning && clockPhase !== 'HT' ? ' · pauza' : ''}
          </span>
        </div>
        <div className={classNames(
          'ml-auto font-display text-5xl sm:text-6xl leading-none tracking-wide tabular-nums',
          clockPhase === 'HT' ? 'text-brand-blue' : 'text-brand-red',
        )}>
          {liveClockText}
        </div>
      </div>
    </div>
  ) : null;

  const card = (
    <div
      className={classNames('card animate-slideUp', finished && 'opacity-[0.97]')}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div
        className="h-1"
        style={{
          background:
            `linear-gradient(90deg, ${homeColor} 0%, ${homeColor} 48%, transparent 48%, transparent 52%, ${awayColor} 52%, ${awayColor} 100%)`,
        }}
      />
      <div className={classNames('px-5', compact ? 'py-3' : 'py-4')}>
        <div className="flex justify-between items-center mb-3">
          <span className="font-cond text-[13px] font-bold text-black/25 tracking-wider">
            {match.time}
          </span>
          <span
            className={classNames(
              'pill inline-flex items-center gap-1.5',
              live && 'border-brand-red/10 bg-brand-red/10 text-brand-red',
              finished && hasPen && 'border-brand-red/10 bg-brand-red/10 text-brand-red',
              finished && !hasPen && 'text-black/45',
              !finished && !live && 'text-black/40'
            )}
          >
            {live && (
              <span className="relative inline-flex w-1.5 h-1.5">
                <span className="absolute inline-flex w-full h-full rounded-full bg-brand-red animate-livePulse" />
                <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-brand-red" />
              </span>
            )}
            {statusLabel}
          </span>
        </div>

        <div className="flex items-center justify-center mb-1">
          <div className="flex-1 flex items-center justify-end pr-3.5 min-w-0">
            <div
              className="font-display text-[42px] leading-none tracking-wide transition-colors truncate"
              style={{
                color: winnerHome ? homeColor : finished ? 'rgba(0,0,0,0.15)' : '#13152a',
              }}
            >
              {homeCode}
            </div>
          </div>
          <div className="flex items-center gap-0.5 bg-brand-dark rounded-2xl px-3.5 py-2 shrink-0">
            <span
              key={`h-${match.homeScore}`}
              className={classNames(
                'font-display text-[44px] leading-none w-8 text-center text-white',
                (finished || live) && 'animate-pop'
              )}
            >
              {finished || live ? match.homeScore : '—'}
            </span>
            <span className="text-xl text-white/25 mx-0.5">:</span>
            <span
              key={`a-${match.awayScore}`}
              className={classNames(
                'font-display text-[44px] leading-none w-8 text-center text-white',
                (finished || live) && 'animate-pop'
              )}
            >
              {finished || live ? match.awayScore : '—'}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-start pl-3.5 min-w-0">
            <div
              className="font-display text-[42px] leading-none tracking-wide transition-colors truncate"
              style={{
                color: winnerAway ? awayColor : finished ? 'rgba(0,0,0,0.15)' : '#13152a',
              }}
            >
              {awayCode}
            </div>
          </div>
        </div>

        {hasGoals && <GoalTimeline goals={goals} homeId={match.homeId} homeColor={homeColor} awayColor={awayColor} />}

        {hasGoals && !compact && (
          <div className="mt-2 mb-3.5">
            {goals.map((g, i) => {
              const isHome = g.teamId === match.homeId;
              const color = isHome ? homeColor : awayColor;
              return (
                <div
                  key={g.id || i}
                  className={classNames(
                    'flex items-center gap-2.5 py-1.5',
                    i > 0 && 'border-t border-[#f5f5f8]'
                  )}
                >
                  <div
                    className="w-7 h-7 rounded-full grid place-items-center text-[11px] font-extrabold shrink-0"
                    style={{ background: `${color}1a`, color }}
                  >
                    G
                  </div>
                  <span className="font-cond text-sm font-bold text-black/30 min-w-[50px]">
                    {g.minute}' {g.half}
                  </span>
                  <span className="font-bold text-[15px]">{g.playerName}</span>
                  <span
                    className="ml-auto text-[13px] font-semibold opacity-60"
                    style={{ color }}
                  >
                    {isHome ? homeCode : awayCode}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {hasPen && (
          <div className="mt-2 mb-3.5 flex items-center gap-3 bg-brand-red/5 rounded-2xl px-4 py-3">
            <div className="w-7 h-7 rounded-full bg-brand-red/10 text-brand-red grid place-items-center text-[11px] font-extrabold shrink-0">P</div>
            <span className="text-[15px] font-semibold text-black/45">Penali</span>
            <span className="font-display text-2xl tracking-wide ml-auto">
              {match.penalties!.home} : {match.penalties!.away}
            </span>
          </div>
        )}

        {finished && match.winnerId && (
          <div
            className="rounded-2xl px-4 py-2.5 flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${winnerHome ? homeColor : awayColor}1a 0%, ${winnerHome ? homeColor : awayColor}0d 100%)`,
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: winnerHome ? homeColor : awayColor }}
            />
            <span
              className="font-cond text-sm font-bold tracking-wider uppercase"
              style={{ color: winnerHome ? homeColor : awayColor }}
            >
              Pobjednik - {winnerHome ? homeCode : awayCode}
              {hasPen ? ' (penali)' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (!linkable) {
    return (
      <div className="space-y-3">
        {banner}
        {card}
      </div>
    );
  }
  return (
    <Link to={`/utakmice/${match.id}`} className="block mb-4 space-y-3">
      {banner}
      {card}
    </Link>
  );
}
