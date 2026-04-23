import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import MatchEdit from './MatchEdit';
import type { Card, Goal, Match, Team } from '../../lib/types';

const {
  mockUseMatch,
  mockUseGoals,
  mockUseCards,
  mockUseTeam,
  mockNavigate,
  mockUpdateDoc,
  mockDoc,
} = vi.hoisted(() => ({
  mockUseMatch: vi.fn<() => Match | null | undefined>(),
  mockUseGoals: vi.fn<() => Goal[]>(),
  mockUseCards: vi.fn<() => Card[]>(),
  mockUseTeam: vi.fn<(id?: string) => Team | null | undefined>(),
  mockNavigate: vi.fn(),
  mockUpdateDoc: vi.fn(async (..._args: unknown[]) => undefined),
  mockDoc: vi.fn((..._args: unknown[]) => ({ path: 'matches/m1' })),
}));

vi.mock('../../lib/hooks', () => ({
  useMatch: () => mockUseMatch(),
  useGoals: () => mockUseGoals(),
  useCards: () => mockUseCards(),
  useTeam: (id?: string) => mockUseTeam(id),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'm1' }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    doc: mockDoc,
    updateDoc: mockUpdateDoc,
  };
});

vi.mock('../../lib/matchClock', () => ({
  endFirstHalf: vi.fn(),
  endMatchClock: vi.fn(),
  getClock: vi.fn(),
  pauseClock: vi.fn(),
  resetClock: vi.fn(),
  resumeClock: vi.fn(),
  startFirstHalf: vi.fn(),
  startSecondHalf: vi.fn(),
  useMatchClock: () => ({
    displayTime: '00:00',
    phase: 'pre',
    phaseLabel: 'Prije početka',
    running: false,
  }),
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

describe('MatchEdit', () => {
  it('updates the match number from admin', async () => {
    mockUseMatch.mockReturnValue(match);
    mockUseGoals.mockReturnValue([]);
    mockUseCards.mockReturnValue([]);
    mockUseTeam.mockImplementation((id?: string) => (id === home.id ? home : id === away.id ? away : null));
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <MatchEdit />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/broj utakmice/i);
    await user.clear(input);
    await user.type(input, 'U2');
    await user.click(screen.getByRole('button', { name: 'Spremi' }));

    await waitFor(() => expect(mockUpdateDoc).toHaveBeenCalled());
    expect(mockUpdateDoc.mock.calls[0]?.[1]).toMatchObject({ matchNumber: 'U2' });
  });
});
