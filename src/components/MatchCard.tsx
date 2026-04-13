import { Link } from 'react-router-dom';
import type { Match, Team, Goal } from '../lib/types';
import GoalTimeline from './GoalTimeline';
import { classNames, shortDateHr, dayLabelShort } from '../lib/utils';

interface Props {
  match: Match;
  home?: Team;
  away?: Team;
  goals?: Goal[];
  index?: number;
  compact?: boolean;
  linkable?: boolean;
}

export default function MatchCard({ match, home, away, goals = [], index = 0, compact, linkable = true }: Props) {
  const hasGoals = goals.length > 0 && match.status !== 'scheduled';
  const hasPen = !!match.penalties;
  const finished = match.status === 'finished';
  const live = match.status === 'live';
  const winnerHome = finished && match.winnerId === match.homeId;
  const winnerAway = finished && match.winnerId === match.awayId;

  const statusLabel =
    live ? 'UŽIVO'
      : finished ? (hasPen ? 'PENALI' : 'KRAJ')
      : `${dayLabelShort(match.date)} ${shortDateHr(match.date)}`;

  const homeCode = home?.code ?? match.homeId;
  const awayCode = away?.code ?? match.awayId;

  const inner = (
    <div
      className="card animate-slideUp"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div
        className="h-1"
        style={{
          background:
            'linear-gradient(90deg, #1d4e9e 0%, #1d4e9e 48%, transparent 48%, transparent 52%, #d42a3c 52%, #d42a3c 100%)',
        }}
      />
      <div className={classNames('px-5', compact ? 'py-3' : 'py-4')}>
        <div className="flex justify-between items-center mb-3">
          <span className="font-cond text-[13px] font-bold text-black/25 tracking-wider">
            {match.time}
          </span>
          <span
            className={classNames(
              'pill',
              live && 'bg-brand-red/10 text-brand-red',
              finished && hasPen && 'bg-brand-red/10 text-brand-red',
              finished && !hasPen && 'bg-black/5 text-black/45',
              !finished && !live && 'bg-black/5 text-black/40'
            )}
          >
            {statusLabel}
          </span>
        </div>

        <div className="flex items-center justify-center mb-1">
          <div className="flex-1 text-right pr-3.5">
            <div
              className={classNames(
                'font-display text-[42px] leading-none tracking-wide',
                winnerHome ? 'text-brand-blue' : finished ? 'text-black/15' : 'text-brand-dark'
              )}
            >
              {homeCode}
            </div>
          </div>
          <div className="flex items-center gap-0.5 bg-brand-dark rounded-2xl px-3.5 py-2 shrink-0">
            <span className="font-display text-[44px] leading-none w-8 text-center text-white">
              {finished || live ? match.homeScore : '—'}
            </span>
            <span className="text-xl text-white/25 mx-0.5">:</span>
            <span className="font-display text-[44px] leading-none w-8 text-center text-white">
              {finished || live ? match.awayScore : '—'}
            </span>
          </div>
          <div className="flex-1 text-left pl-3.5">
            <div
              className={classNames(
                'font-display text-[42px] leading-none tracking-wide',
                winnerAway ? 'text-brand-red' : finished ? 'text-black/15' : 'text-brand-dark'
              )}
            >
              {awayCode}
            </div>
          </div>
        </div>

        {hasGoals && <GoalTimeline goals={goals} homeId={match.homeId} />}

        {hasGoals && !compact && (
          <div className="mt-2 mb-3.5">
            {goals.map((g, i) => {
              const isHome = g.teamId === match.homeId;
              return (
                <div
                  key={g.id || i}
                  className={classNames(
                    'flex items-center gap-2.5 py-1.5',
                    i > 0 && 'border-t border-[#f5f5f8]'
                  )}
                >
                  <div
                    className={classNames(
                      'w-7 h-7 rounded-full grid place-items-center text-[11px] font-extrabold shrink-0',
                      isHome ? 'bg-brand-blue/10 text-brand-blue' : 'bg-brand-red/10 text-brand-red'
                    )}
                  >
                    G
                  </div>
                  <span className="font-cond text-sm font-bold text-black/30 min-w-[50px]">
                    {g.minute}' {g.half}
                  </span>
                  <span className="font-bold text-[15px]">{g.playerName}</span>
                  <span
                    className={classNames(
                      'ml-auto text-[13px] font-semibold opacity-50',
                      isHome ? 'text-brand-blue' : 'text-brand-red'
                    )}
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
            className={classNames(
              'rounded-2xl px-4 py-2.5 flex items-center justify-center gap-2',
              winnerHome
                ? 'bg-gradient-to-br from-brand-blue/10 to-brand-blue/5'
                : 'bg-gradient-to-br from-brand-red/10 to-brand-red/5'
            )}
          >
            <div className={classNames('w-1.5 h-1.5 rounded-full', winnerHome ? 'bg-brand-blue' : 'bg-brand-red')} />
            <span
              className={classNames(
                'font-cond text-sm font-bold tracking-wider uppercase',
                winnerHome ? 'text-brand-blue' : 'text-brand-red'
              )}
            >
              Pobjednik — {winnerHome ? homeCode : awayCode}
              {hasPen ? ' (penali)' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (!linkable) return inner;
  return <Link to={`/utakmice/${match.id}`} className="block mb-4">{inner}</Link>;
}
