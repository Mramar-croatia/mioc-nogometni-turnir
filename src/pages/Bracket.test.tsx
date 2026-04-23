import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Bracket from './Bracket';
import type { Match, Team } from '../lib/types';

const mockUseMatches = vi.fn<() => Match[] | null>();
const mockUseTeams = vi.fn<() => Team[] | null>();

vi.mock('../lib/hooks', () => ({
  useMatches: () => mockUseMatches(),
  useTeams: () => mockUseTeams(),
}));

const teams: Team[] = [
  {
    id: 't1',
    code: 'A1',
    displayName: 'Alpha 1',
    grade: 1,
    class: 'A',
    division: 'm',
    captain: 'Captain A',
    playersCount: 7,
    players: [],
    color: '#1d4e9e',
  },
  {
    id: 't2',
    code: 'B1',
    displayName: 'Beta 1',
    grade: 1,
    class: 'B',
    division: 'm',
    captain: 'Captain B',
    playersCount: 7,
    players: [],
    color: '#d42a3c',
  },
];

const matches: Match[] = [
  {
    id: 'm1',
    stage: 'R1',
    bracketSlot: 'R1-1',
    matchNumber: 'U1',
    date: '2026-04-25',
    time: '10:00',
    homeId: 't1',
    awayId: 't2',
    homeScore: 0,
    awayScore: 0,
    status: 'scheduled',
    winnerId: null,
    penalties: null,
    durationMin: 20,
  },
];

describe('Bracket', () => {
  beforeEach(() => {
    mockUseMatches.mockReturnValue(matches);
    mockUseTeams.mockReturnValue(teams);
  });

  it('shows a highlighted update that the tournament moved into drugo kolo', () => {
    render(
      <MemoryRouter>
        <Bracket />
      </MemoryRouter>
    );

    expect(screen.getByText(/turnir je sada u drugom krugu/i)).toBeInTheDocument();
  });

  it('renders the three double-elimination branches as tabs', () => {
    render(
      <MemoryRouter>
        <Bracket />
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /grane turnira/i });
    expect(nav).toBeInTheDocument();
    expect(screen.getAllByText(/pobjednička grana/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/gubitnička grana/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/veliko finale/i).length).toBeGreaterThan(0);
  });

  it('places a U-numbered match inside the planned bracket rather than the fallback bucket', () => {
    render(
      <MemoryRouter>
        <Bracket />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /utakmica 1\b/i })).toHaveAttribute(
      'href',
      '/utakmice/m1'
    );
    expect(screen.queryByText(/ostale utakmice/i)).not.toBeInTheDocument();
  });
});
