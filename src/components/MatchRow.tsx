import { Link } from 'react-router-dom';
import type { Match, Team } from '../lib/types';
import { classNames } from '../lib/utils';

const DAY_SHORT_HR = ['Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub'];

function dayShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return DAY_SHORT_HR[d.getDay()];
}

function dateShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

interface Props {
  match: Match;
  home?: Team;
  away?: Team;
  showDate?: boolean;
}

export default function MatchRow({ match, home, away, showDate }: Props) {
  const completed = match.status === 'finished';
  const live = match.status === 'live';
  const hasPen = !!match.penalties;
  const homeWinner = completed && match.winnerId === match.homeId;
  const awayWinner = completed && match.winnerId === match.awayId;

  return (
    <Link
      to={`/utakmice/${match.id}`}
      className={classNames(
        'flex items-center rounded-xl px-3.5 py-2.5 mb-[5px] last:mb-0 transition',
        completed
          ? 'bg-emerald-50/70 ring-1 ring-inset ring-emerald-100 hover:bg-emerald-50'
          : live
          ? 'bg-brand-red/5 ring-1 ring-inset ring-brand-red/15 hover:bg-brand-red/10'
          : 'hover:bg-black/[0.03]'
      )}
    >
      {showDate ? (
        <div className="w-[58px] shrink-0 leading-tight">
          <div className="font-cond text-[10px] font-bold uppercase tracking-[0.1em] text-brand-dark/80">
            {dayShort(match.date)} {dateShort(match.date)}
          </div>
          <div className="font-mono text-[11px] font-semibold text-black/40 mt-0.5">
            {match.time}
          </div>
        </div>
      ) : (
        <div className="font-mono text-[11px] font-semibold text-black/40 w-[42px] shrink-0">
          {match.time}
        </div>
      )}
      <div className="flex-1 flex items-center justify-center gap-3">
        <div
          className={classNames(
            'text-[15px] min-w-[52px] text-right',
            homeWinner ? 'font-extrabold text-emerald-700' : 'font-bold text-black/85'
          )}
        >
          {home?.code ?? '?'}
        </div>
        <div
          className={classNames(
            'rounded-full px-2.5 py-[3px] text-[10px] font-bold uppercase tracking-[0.06em] shrink-0',
            completed
              ? 'bg-emerald-100 text-emerald-700'
              : live
              ? 'bg-brand-red text-white'
              : 'bg-brand-blue/10 text-brand-blue'
          )}
        >
          {completed ? `${match.homeScore}:${match.awayScore}${hasPen ? '*' : ''}` : live ? 'LIVE' : 'vs'}
        </div>
        <div
          className={classNames(
            'text-[15px] min-w-[52px] text-left',
            awayWinner ? 'font-extrabold text-emerald-700' : 'font-bold text-black/85'
          )}
        >
          {away?.code ?? '?'}
        </div>
      </div>
    </Link>
  );
}
