import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import MatchCreate from './MatchCreate';
import type { Team } from '../../lib/types';

const {
  mockUseTeams,
  mockNavigate,
  mockAddDoc,
  mockCollection,
} = vi.hoisted(() => ({
  mockUseTeams: vi.fn<() => Team[] | null>(),
  mockNavigate: vi.fn(),
  mockAddDoc: vi.fn(async () => ({ id: 'new-match' })),
  mockCollection: vi.fn((..._args: unknown[]) => ({ path: 'matches' })),
}));

vi.mock('../../lib/hooks', () => ({
  useTeams: () => mockUseTeams(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    addDoc: mockAddDoc,
    collection: mockCollection,
  };
});

const teams: Team[] = [
  {
    id: 'home',
    code: 'DOM',
    displayName: 'Domaci',
    grade: 1,
    class: 'A',
    division: 'm',
    captain: 'Kapetan Dom',
    playersCount: 7,
    players: [],
  },
  {
    id: 'away',
    code: 'GOS',
    displayName: 'Gosti',
    grade: 1,
    class: 'B',
    division: 'm',
    captain: 'Kapetan Gos',
    playersCount: 7,
    players: [],
  },
];

describe('MatchCreate', () => {
  it('saves the match number for second-round matches', async () => {
    mockUseTeams.mockReturnValue(teams);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <MatchCreate />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'Pobjednička' }));
    await user.type(screen.getByLabelText(/broj utakmice/i), 'U1');
    await user.selectOptions(screen.getByLabelText('Domaći'), 'home');
    await user.selectOptions(screen.getByLabelText('Gosti'), 'away');
    await user.click(screen.getByRole('button', { name: 'Stvori utakmicu' }));

    await waitFor(() => expect(mockAddDoc).toHaveBeenCalled());
    const calls = mockAddDoc.mock.calls as unknown[][];
    const payload = calls[0]?.[1] as Record<string, unknown> | undefined;
    expect(payload).toMatchObject({ matchNumber: 'U1' });
  });
});
