import { describe, expect, it } from 'vitest';
import { getTeamEliminationState } from './teamElimination';
import type { Match } from './types';

const baseMatch = {
  date: '2026-04-24',
  time: '10:00',
  homeScore: 0,
  awayScore: 0,
  status: 'finished' as const,
  penalties: null,
  durationMin: 20,
};

function createMatch(overrides: Partial<Match>): Match {
  return {
    id: overrides.id ?? 'match',
    stage: overrides.stage ?? 'WB',
    homeId: overrides.homeId ?? 'team-a',
    awayId: overrides.awayId ?? 'team-b',
    winnerId: overrides.winnerId ?? overrides.homeId ?? 'team-a',
    ...baseMatch,
    ...overrides,
  };
}

describe('getTeamEliminationState', () => {
  it('marks a team eliminated after a finished first-round loss', () => {
    const matches = [
      createMatch({
        id: 'r1-loss',
        stage: 'R1',
        homeId: 'team-a',
        awayId: 'team-b',
        winnerId: 'team-b',
      }),
    ];

    expect(getTeamEliminationState('team-a', matches, 'auto')).toMatchObject({
      autoEliminated: true,
      effectiveEliminated: true,
      source: 'auto',
      losses: 1,
    });
  });

  it('keeps a team active after a single non-round-one loss', () => {
    const matches = [
      createMatch({
        id: 'wb-loss',
        stage: 'WB',
        homeId: 'team-a',
        awayId: 'team-b',
        winnerId: 'team-b',
      }),
    ];

    expect(getTeamEliminationState('team-a', matches, 'auto')).toMatchObject({
      autoEliminated: false,
      effectiveEliminated: false,
      source: 'auto',
      losses: 1,
    });
  });

  it('marks a team eliminated after a second finished loss outside round one', () => {
    const matches = [
      createMatch({
        id: 'wb-loss',
        stage: 'WB',
        homeId: 'team-a',
        awayId: 'team-b',
        winnerId: 'team-b',
      }),
      createMatch({
        id: 'lb-loss',
        stage: 'LB',
        homeId: 'team-c',
        awayId: 'team-a',
        winnerId: 'team-c',
      }),
    ];

    expect(getTeamEliminationState('team-a', matches, 'auto')).toMatchObject({
      autoEliminated: true,
      effectiveEliminated: true,
      source: 'auto',
      losses: 2,
    });
  });

  it('lets admin force an eliminated team back to active', () => {
    const matches = [
      createMatch({
        id: 'r1-loss',
        stage: 'R1',
        homeId: 'team-a',
        awayId: 'team-b',
        winnerId: 'team-b',
      }),
    ];

    expect(getTeamEliminationState('team-a', matches, 'active')).toMatchObject({
      autoEliminated: true,
      effectiveEliminated: false,
      source: 'manual',
    });
  });

  it('lets admin force an active team to eliminated', () => {
    const matches = [
      createMatch({
        id: 'wb-win',
        stage: 'WB',
        homeId: 'team-a',
        awayId: 'team-b',
        winnerId: 'team-a',
      }),
    ];

    expect(getTeamEliminationState('team-a', matches, 'eliminated')).toMatchObject({
      autoEliminated: false,
      effectiveEliminated: true,
      source: 'manual',
    });
  });
});
