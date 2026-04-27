import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Home from './Home';
import type { Match, Team } from '../lib/types';

const mockUseMatches = vi.fn<() => Match[] | null>();
const mockUseTeams = vi.fn<() => Team[] | null>();
const mockUseAllGoals = vi.fn<() => { id: string }[] | null>();

vi.mock('../lib/hooks', () => ({
  useMatches: () => mockUseMatches(),
  useTeams: () => mockUseTeams(),
  useAllGoals: () => mockUseAllGoals(),
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
];

const matches: Match[] = [
  {
    id: 'm1',
    stage: 'WB',
    date: '2099-04-25',
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

describe('Home status banner', () => {
  beforeEach(() => {
    mockUseMatches.mockReturnValue(matches);
    mockUseTeams.mockReturnValue(teams);
    mockUseAllGoals.mockReturnValue([]);
  });

  it('shows the second-round update above the countdown card', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const countdown = screen.getByText(/sljedeća utakmica/i);
    const banner = screen.getByText(/aktualna faza/i);
    const bannerCard = banner.parentElement;

    expect(banner).toBeInTheDocument();
    expect(screen.getByText(/drugi krug/i)).toBeInTheDocument();
    expect(countdown.compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(bannerCard).toHaveClass('bg-white');
  });
});
