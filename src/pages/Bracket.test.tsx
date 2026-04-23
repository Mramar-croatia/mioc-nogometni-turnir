import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

function setScreenWidth(isMobile: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: isMobile && query === '(max-width: 639px)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('Bracket mobile collapse', () => {
  beforeEach(() => {
    mockUseMatches.mockReturnValue(matches);
    mockUseTeams.mockReturnValue(teams);
  });

  it('shows a highlighted update that the tournament moved into drugo kolo', () => {
    setScreenWidth(false);

    render(
      <MemoryRouter>
        <Bracket />
      </MemoryRouter>
    );

    expect(screen.getByText(/turnir je sada u drugom krugu/i)).toBeInTheDocument();
  });

  it('keeps prvo kolo collapsed by default on mobile and expands on tap', async () => {
    setScreenWidth(true);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Bracket />
      </MemoryRouter>
    );

    const toggle = screen.getByRole('button', { name: /1\. kolo/i });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('R1-1')).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('R1-1')).toBeInTheDocument();
  });
});
