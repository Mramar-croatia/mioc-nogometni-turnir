import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Teams from './Teams';
import type { Match, Team } from '../lib/types';

const mockUseMatches = vi.fn<() => Match[] | null>();
const mockUseTeams = vi.fn<() => Team[] | null>();

vi.mock('../lib/hooks', () => ({
  useMatches: () => mockUseMatches(),
  useTeams: () => mockUseTeams(),
}));

const teams: Team[] = [
  {
    id: 'active-team',
    code: 'A1',
    displayName: 'Aktivni',
    grade: 1,
    class: 'A',
    division: 'm',
    captain: 'Captain Active',
    playersCount: 7,
    players: [],
    eliminationOverride: 'auto',
  },
  {
    id: 'eliminated-team',
    code: 'B1',
    displayName: 'Ispali',
    grade: 1,
    class: 'B',
    division: 'm',
    captain: 'Captain Out',
    playersCount: 7,
    players: [],
    eliminationOverride: 'auto',
  },
];

const matches: Match[] = [
  {
    id: 'r1-loss',
    stage: 'R1',
    date: '2026-04-24',
    time: '10:00',
    homeId: 'eliminated-team',
    awayId: 'other',
    homeScore: 0,
    awayScore: 1,
    status: 'finished',
    winnerId: 'other',
    penalties: null,
    durationMin: 20,
  },
];

describe('Teams eliminated state', () => {
  beforeEach(() => {
    mockUseTeams.mockReturnValue(teams);
    mockUseMatches.mockReturnValue(matches);
  });

  it('shows an eliminated badge for teams that are out of the tournament', () => {
    render(
      <MemoryRouter>
        <Teams />
      </MemoryRouter>
    );

    const badge = screen.getByLabelText('Status ekipe B1');

    expect(screen.getByText('ISPALA')).toBeInTheDocument();
    expect(badge).toHaveTextContent('ISPALA');
    expect(badge.className).toContain('text-brand-red');
    expect(screen.queryByLabelText('Status ekipe A1')).not.toBeInTheDocument();
  });
});
