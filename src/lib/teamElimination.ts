import type { Match, TeamEliminationOverride } from './types';

export interface TeamEliminationState {
  losses: number;
  lostRoundOne: boolean;
  autoEliminated: boolean;
  effectiveEliminated: boolean;
  source: 'auto' | 'manual';
  override: TeamEliminationOverride;
}

function normalizeOverride(override: TeamEliminationOverride | null | undefined): TeamEliminationOverride {
  return override ?? 'auto';
}

function isFinishedLoss(teamId: string, match: Match) {
  if (match.status !== 'finished' || !match.winnerId) return false;
  if (match.homeId !== teamId && match.awayId !== teamId) return false;
  return match.winnerId !== teamId;
}

export function getTeamEliminationState(
  teamId: string,
  matches: Match[],
  override?: TeamEliminationOverride | null,
): TeamEliminationState {
  const losses = matches.filter((match) => isFinishedLoss(teamId, match)).length;
  const lostRoundOne = matches.some((match) => match.stage === 'R1' && isFinishedLoss(teamId, match));
  const autoEliminated = lostRoundOne || losses >= 2;
  const normalizedOverride = normalizeOverride(override);
  const effectiveEliminated =
    normalizedOverride === 'eliminated' ? true
      : normalizedOverride === 'active' ? false
        : autoEliminated;

  return {
    losses,
    lostRoundOne,
    autoEliminated,
    effectiveEliminated,
    source: normalizedOverride === 'auto' ? 'auto' : 'manual',
    override: normalizedOverride,
  };
}
