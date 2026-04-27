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
  useTournamentMeta: () => ({ currentStage: 'R2' }),
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
  {
    id: 't3',
    code: 'D1',
    displayName: 'Delta 1',
    grade: 1,
    class: 'D',
    division: 'm',
    captain: 'Captain D',
    playersCount: 7,
    players: [],
    color: '#0f766e',
  },
  {
    id: 't4',
    code: '3.F',
    displayName: 'Foxtrot 3',
    grade: 3,
    class: 'F',
    division: 'm',
    captain: 'Captain F',
    playersCount: 7,
    players: [],
    color: '#7c3aed',
  },
  {
    id: 't5',
    code: '4.G',
    displayName: 'Golf 4',
    grade: 4,
    class: 'G',
    division: 'm',
    captain: 'Captain G',
    playersCount: 7,
    players: [],
    color: '#ea580c',
  },
  {
    id: 't6',
    code: '3.MN',
    displayName: 'MN 3',
    grade: 3,
    class: 'MN',
    division: 'm',
    captain: 'Captain MN',
    playersCount: 7,
    players: [],
    color: '#be123c',
  },
  {
    id: 't7',
    code: 'X1',
    displayName: 'Extra 1',
    grade: 1,
    class: 'X',
    division: 'm',
    captain: 'Captain X',
    playersCount: 7,
    players: [],
    color: '#2563eb',
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
  {
    id: 'm2',
    stage: 'R1',
    bracketSlot: 'R1-2',
    matchNumber: 'U2',
    date: '2026-04-25',
    time: '10:30',
    homeId: 't7',
    awayId: 't2',
    homeScore: 2,
    awayScore: 0,
    status: 'finished',
    winnerId: 't7',
    penalties: null,
    durationMin: 20,
  },
  {
    id: 'm3',
    stage: 'R1',
    bracketSlot: 'R1-3',
    matchNumber: 'U3',
    date: '2026-04-25',
    time: '11:00',
    homeId: 't3',
    awayId: 't2',
    homeScore: 1,
    awayScore: 0,
    status: 'finished',
    winnerId: 't3',
    penalties: null,
    durationMin: 20,
  },
  {
    id: 'u6',
    stage: 'WB',
    bracketSlot: 'WB-QF1',
    matchNumber: 'U6',
    date: '2026-04-26',
    time: '10:00',
    homeId: 't5',
    awayId: 't1',
    homeScore: 0,
    awayScore: 0,
    status: 'scheduled',
    winnerId: null,
    penalties: null,
    durationMin: 20,
  },
  {
    id: 'u7',
    stage: 'WB',
    bracketSlot: 'WB-QF2',
    matchNumber: 'U7',
    date: '2026-04-26',
    time: '10:30',
    homeId: 't2',
    awayId: 't4',
    homeScore: 0,
    awayScore: 0,
    status: 'scheduled',
    winnerId: null,
    penalties: null,
    durationMin: 20,
  },
  {
    id: 'u8',
    stage: 'WB',
    bracketSlot: 'WB-QF3',
    matchNumber: 'U8',
    date: '2026-04-26',
    time: '11:00',
    homeId: 't6',
    awayId: 't2',
    homeScore: 0,
    awayScore: 0,
    status: 'scheduled',
    winnerId: null,
    penalties: null,
    durationMin: 20,
  },
];

function getByeCard(flow: string) {
  const card = screen.getByText(flow).closest('div.rounded-2xl');
  if (!card) {
    throw new Error(`Bye card not found for ${flow}`);
  }
  return card;
}

describe('Bracket', () => {
  beforeEach(() => {
    mockUseMatches.mockReturnValue(matches);
    mockUseTeams.mockReturnValue(teams);
  });

  it('shows a highlighted update with the current tournament stage', () => {
    render(
      <MemoryRouter>
        <Bracket />
      </MemoryRouter>
    );

    expect(screen.getByText(/aktualna faza/i)).toBeInTheDocument();
    expect(screen.getByText(/drugi krug/i)).toBeInTheDocument();
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

  it('shows bye teams from the actual winner-branch slots instead of the earliest R1 winners', () => {
    render(
      <MemoryRouter>
        <Bracket />
      </MemoryRouter>
    );

    expect(getByeCard('Ide u U6')).toHaveTextContent('4.G');
    expect(getByeCard('Ide u U7')).toHaveTextContent('3.F');
    expect(getByeCard('Ide u U8')).toHaveTextContent('3.MN');
  });

  it('falls back to the configured bye teams when U6-U8 have not been created yet', () => {
    mockUseMatches.mockReturnValue(matches.filter((match) => !['U6', 'U7', 'U8'].includes(match.matchNumber ?? '')));

    render(
      <MemoryRouter>
        <Bracket />
      </MemoryRouter>
    );

    expect(getByeCard('Ide u U6')).toHaveTextContent('4.G');
    expect(getByeCard('Ide u U7')).toHaveTextContent('3.F');
    expect(getByeCard('Ide u U8')).toHaveTextContent('3.MN');
  });
});
