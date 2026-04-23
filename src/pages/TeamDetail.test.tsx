import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TeamDetail from './TeamDetail';
import type { Goal, Match, Team } from '../lib/types';

const mockUseTeam = vi.fn<() => Team | null | undefined>();
const mockUseMatches = vi.fn<() => Match[] | null>();
const mockUseTeams = vi.fn<() => Team[] | null>();
const mockUseAllGoals = vi.fn<() => Goal[] | null>();
const mockUseFollowedTeams = vi.fn<() => {
  isFollowed: (id: string) => boolean;
  toggle: (id: string) => void;
}>();

vi.mock('../lib/hooks', () => ({
  useTeam: () => mockUseTeam(),
  useMatches: () => mockUseMatches(),
  useTeams: () => mockUseTeams(),
  useAllGoals: () => mockUseAllGoals(),
}));

vi.mock('../lib/favorites', () => ({
  useFollowedTeams: () => mockUseFollowedTeams(),
}));

const team: Team = {
  id: 'team-1',
  code: 'A1',
  displayName: 'Alpha 1',
  grade: 1,
  class: 'A',
  division: 'm',
  captain: 'Captain A',
  playersCount: 7,
  players: [],
  eliminationOverride: 'auto',
};

const matches: Match[] = [
  {
    id: 'r1-loss',
    stage: 'R1',
    date: '2026-04-24',
    time: '10:00',
    homeId: 'team-1',
    awayId: 'team-2',
    homeScore: 0,
    awayScore: 1,
    status: 'finished',
    winnerId: 'team-2',
    penalties: null,
    durationMin: 20,
  },
];

describe('TeamDetail eliminated state', () => {
  beforeEach(() => {
    mockUseTeam.mockReturnValue(team);
    mockUseMatches.mockReturnValue(matches);
    mockUseTeams.mockReturnValue([team]);
    mockUseAllGoals.mockReturnValue([]);
    mockUseFollowedTeams.mockReturnValue({
      isFollowed: () => false,
      toggle: vi.fn(),
    });
  });

  it('shows that the team has been eliminated', () => {
    render(
      <MemoryRouter initialEntries={['/ekipe/team-1']}>
        <Routes>
          <Route path="/ekipe/:id" element={<TeamDetail />} />
        </Routes>
      </MemoryRouter>
    );

    const badge = screen.getByText(/ispala iz turnira/i);

    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('text-brand-red');
  });
});
