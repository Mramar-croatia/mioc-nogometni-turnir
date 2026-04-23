import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TeamEdit from './TeamEdit';
import type { Match, Team } from '../../lib/types';

const {
  mockUseTeam,
  mockUseMatches,
  mockNavigate,
  mockSetDoc,
  mockAddDoc,
  mockDoc,
  mockCollection,
} = vi.hoisted(() => ({
  mockUseTeam: vi.fn<() => Team | null | undefined>(),
  mockUseMatches: vi.fn<() => Match[] | null>(),
  mockNavigate: vi.fn(),
  mockSetDoc: vi.fn(async (..._args: unknown[]) => undefined),
  mockAddDoc: vi.fn(async (..._args: unknown[]) => undefined),
  mockDoc: vi.fn((..._args: unknown[]) => ({ path: 'teams/team-1' })),
  mockCollection: vi.fn((..._args: unknown[]) => ({ path: 'teams' })),
}));

vi.mock('../../lib/hooks', () => ({
  useTeam: () => mockUseTeam(),
  useMatches: () => mockUseMatches(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'team-1' }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    addDoc: mockAddDoc,
    collection: mockCollection,
    doc: mockDoc,
    setDoc: mockSetDoc,
  };
});

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

describe('TeamEdit elimination override', () => {
  beforeEach(() => {
    mockUseTeam.mockReturnValue(team);
    mockUseMatches.mockReturnValue(matches);
    mockSetDoc.mockClear();
    mockNavigate.mockClear();
  });

  it('saves a manual eliminated override from admin controls', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <TeamEdit />
      </MemoryRouter>
    );

    expect(
      screen.getByText((_, element) => element?.textContent === 'Automatski status trenutno: Ispala')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Označi kao ispalu' }));
    await user.click(screen.getByRole('button', { name: 'Spremi izmjene' }));

    await waitFor(() => {
      expect(mockSetDoc).toHaveBeenCalled();
    });

    const savedPayload = mockSetDoc.mock.calls[0]?.[1] as { eliminationOverride?: string } | undefined;

    expect(savedPayload).toMatchObject({
      eliminationOverride: 'eliminated',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/admin/ekipe');
  });
});
