import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Matches from './Matches';
import type { Match, Team } from '../lib/types';

const mockUseMatches = vi.fn<() => Match[] | null>();
const mockUseTeams = vi.fn<() => Team[] | null>();

vi.mock('../lib/hooks', () => ({
  useMatches: () => mockUseMatches(),
  useTeams: () => mockUseTeams(),
}));

const teams: Team[] = [
  {
    id: 'r1-home',
    code: 'R1A',
    displayName: 'Round One A',
    grade: 1,
    class: 'A',
    division: 'm',
    captain: 'Captain R1A',
    playersCount: 7,
    players: [],
  },
  {
    id: 'r1-away',
    code: 'R1B',
    displayName: 'Round One B',
    grade: 1,
    class: 'B',
    division: 'm',
    captain: 'Captain R1B',
    playersCount: 7,
    players: [],
  },
  {
    id: 'wb-home',
    code: 'WBA',
    displayName: 'Winners A',
    grade: 1,
    class: 'A',
    division: 'm',
    captain: 'Captain WBA',
    playersCount: 7,
    players: [],
  },
  {
    id: 'wb-away',
    code: 'WBB',
    displayName: 'Winners B',
    grade: 1,
    class: 'B',
    division: 'm',
    captain: 'Captain WBB',
    playersCount: 7,
    players: [],
  },
  {
    id: 'lb-home',
    code: 'LBA',
    displayName: 'Losers A',
    grade: 1,
    class: 'A',
    division: 'm',
    captain: 'Captain LBA',
    playersCount: 7,
    players: [],
  },
  {
    id: 'lb-away',
    code: 'LBB',
    displayName: 'Losers B',
    grade: 1,
    class: 'B',
    division: 'm',
    captain: 'Captain LBB',
    playersCount: 7,
    players: [],
  },
];

const matches: Match[] = [
  {
    id: 'r1',
    stage: 'R1',
    date: '2026-04-25',
    time: '09:00',
    homeId: 'r1-home',
    awayId: 'r1-away',
    homeScore: 0,
    awayScore: 0,
    status: 'scheduled',
    winnerId: null,
    penalties: null,
    durationMin: 20,
  },
  {
    id: 'wb-finished',
    stage: 'WB',
    date: '2026-04-25',
    time: '10:00',
    homeId: 'wb-home',
    awayId: 'wb-away',
    homeScore: 2,
    awayScore: 1,
    status: 'finished',
    winnerId: 'wb-home',
    penalties: null,
    durationMin: 20,
  },
  {
    id: 'lb-scheduled',
    stage: 'LB',
    date: '2026-04-25',
    time: '11:00',
    homeId: 'lb-home',
    awayId: 'lb-away',
    homeScore: 0,
    awayScore: 0,
    status: 'scheduled',
    winnerId: null,
    penalties: null,
    durationMin: 20,
  },
];

describe('Matches filters', () => {
  beforeEach(() => {
    mockUseMatches.mockReturnValue(matches);
    mockUseTeams.mockReturnValue(teams);
  });

  it('shows round one matches only in the dedicated prvo kolo filter', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Matches />
      </MemoryRouter>
    );

    expect(screen.queryByText('R1A')).not.toBeInTheDocument();
    expect(screen.getByText('WBA')).toBeInTheDocument();
    expect(screen.getByText('LBA')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sljedeće' }));

    expect(screen.queryByText('R1A')).not.toBeInTheDocument();
    expect(screen.queryByText('WBA')).not.toBeInTheDocument();
    expect(screen.getByText('LBA')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Odigrane' }));

    expect(screen.queryByText('R1A')).not.toBeInTheDocument();
    expect(screen.getByText('WBA')).toBeInTheDocument();
    expect(screen.queryByText('LBA')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Utakmice prvog kola' }));

    expect(screen.getByText('R1A')).toBeInTheDocument();
    expect(screen.queryByText('WBA')).not.toBeInTheDocument();
    expect(screen.queryByText('LBA')).not.toBeInTheDocument();
  });

  it('shows the match number badge in the schedule for second-round matches', () => {
    mockUseMatches.mockReturnValue([
      {
        ...matches[1],
        matchNumber: 'U1',
      },
    ]);

    render(
      <MemoryRouter>
        <Matches />
      </MemoryRouter>
    );

    expect(screen.getByText('U1')).toBeInTheDocument();
  });
});
