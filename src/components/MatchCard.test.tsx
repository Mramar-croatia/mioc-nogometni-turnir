import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MatchCard from './MatchCard';
import type { Goal, Match, Team } from '../lib/types';

vi.mock('../lib/matchClock', () => ({
  useMatchClock: () => ({
    displayTime: '00:00',
    phase: 'FT',
    phaseLabel: 'Gotovo',
    running: false,
  }),
}));

const home: Team = {
  id: 'home',
  code: 'MIOC',
  displayName: 'Home Team',
  grade: 1,
  class: 'A',
  division: 'm',
  captain: 'Captain Home',
  playersCount: 7,
  players: [],
};

const away: Team = {
  id: 'away',
  code: 'GOST',
  displayName: 'Away Team',
  grade: 1,
  class: 'B',
  division: 'm',
  captain: 'Captain Away',
  playersCount: 7,
  players: [],
};

const match: Match = {
  id: 'match-1',
  stage: 'R1',
  date: '2026-04-23',
  time: '12:00',
  homeId: home.id,
  awayId: away.id,
  homeScore: 2,
  awayScore: 1,
  status: 'finished',
  winnerId: home.id,
  penalties: null,
  durationMin: 20,
};

describe('MatchCard', () => {
  it('renders goals in chronological order across halves', () => {
    const goals: Goal[] = [
      { id: 'goal-1', playerName: 'Second Half Early', teamId: away.id, minute: 4, half: 'II' },
      { id: 'goal-2', playerName: 'Second Half Later', teamId: home.id, minute: 7, half: 'II' },
      { id: 'goal-3', playerName: 'First Half Late', teamId: home.id, minute: 9, half: 'I' },
    ];

    render(<MatchCard match={match} home={home} away={away} goals={goals} linkable={false} />);

    const content = document.body.textContent ?? '';
    expect(content.indexOf('First Half Late')).toBeGreaterThanOrEqual(0);
    expect(content.indexOf('Second Half Early')).toBeGreaterThanOrEqual(0);
    expect(content.indexOf('Second Half Later')).toBeGreaterThanOrEqual(0);
    expect(content.indexOf('First Half Late')).toBeLessThan(content.indexOf('Second Half Early'));
    expect(content.indexOf('Second Half Early')).toBeLessThan(content.indexOf('Second Half Later'));
  });
});
