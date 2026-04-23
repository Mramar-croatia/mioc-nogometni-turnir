import type { TeamEliminationState } from '../lib/teamElimination';
import { classNames } from '../lib/utils';

interface Props {
  state: TeamEliminationState;
  teamCode?: string;
  variant?: 'default' | 'detail';
  showManualNote?: boolean;
}

export default function TeamEliminationBadge({
  state,
  teamCode,
  variant = 'default',
  showManualNote = false,
}: Props) {
  if (!state.effectiveEliminated) return null;

  if (variant === 'detail') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center rounded-full border border-brand-red/20 bg-brand-red/10 px-3 py-1 font-cond text-[11px] font-bold uppercase tracking-[0.16em] text-brand-red"
          aria-label={teamCode ? `Status ekipe ${teamCode}` : undefined}
        >
          Ispala iz turnira
        </span>
        {showManualNote && state.source === 'manual' && (
          <span className="font-cond text-[10px] uppercase tracking-[0.14em] text-brand-red/70">
            Ručno označeno
          </span>
        )}
      </div>
    );
  }

  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-full border border-brand-red/20 bg-brand-red/10 px-2 py-[3px]',
        'font-cond text-[10px] font-bold uppercase tracking-[0.16em] text-brand-red'
      )}
      aria-label={teamCode ? `Status ekipe ${teamCode}` : undefined}
    >
      ISPALA
      {showManualNote && state.source === 'manual' ? ' · ručno' : ''}
    </span>
  );
}
