import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MatchDetail from './MatchDetail';
import type { Card, Goal, Match, Team } from '../lib/types';

const mockUseMatch = vi.fn<() => Match | null | undefined>();
const mockUseGoals = vi.fn<() => Goal[]>();
const mockUseCards = vi.fn<() => Card[]>();
const mockUseTeam = vi.fn<(id?: string) => Team | null | undefined>();
const mockUseTeams = vi.fn<() => Team[] | null>();

vi.mock('../lib/hooks', () => ({
  useMatch: () => mockUseMatch(),
  useGoals: () => mockUseGoals(),
  useCards: () => mockUseCards(),
  useTeam: (id?: string) => mockUseTeam(id),
  useTeams: () => mockUseTeams(),
}));

vi.mock('../components/MatchCard', () => ({
  default: () => <div>Match card</div>,
}));

const home: Team = {
  id: 'home',
  code: 'DOM',
  displayName: 'Domaci',
  grade: 1,
  class: 'A',
  division: 'm',
  captain: 'Kapetan Dom',
  playersCount: 7,
  players: [],
};

const away: Team = {
  id: 'away',
  code: 'GOS',
  displayName: 'Gosti',
  grade: 1,
  class: 'B',
  division: 'm',
  captain: 'Kapetan Gos',
  playersCount: 7,
  players: [],
};

const match: Match = {
  id: 'm1',
  stage: 'WB',
  matchNumber: 'U1',
  date: '2026-04-25',
  time: '10:00',
  homeId: home.id,
  awayId: away.id,
  homeScore: 0,
  awayScore: 0,
  status: 'scheduled',
  winnerId: null,
  penalties: null,
  durationMin: 20,
};

describe('MatchDetail', () => {
  beforeEach(() => {
    mockUseMatch.mockReturnValue(match);
    mockUseGoals.mockReturnValue([]);
    mockUseCards.mockReturnValue([]);
    mockUseTeam.mockImplementation((id?: string) => (id === home.id ? home : id === away.id ? away : null));
    mockUseTeams.mockReturnValue([home, away]);
  });

  it('shows the match number badge when provided', () => {
    render(
      <MemoryRouter initialEntries={['/utakmice/m1']}>
        <Routes>
          <Route path="/utakmice/:id" element={<MatchDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('U1')).toBeInTheDocument();
  });
});
