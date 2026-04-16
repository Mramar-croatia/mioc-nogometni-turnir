export type Division = string;
export type MatchStatus = 'scheduled' | 'live' | 'finished';
export type Stage = 'R1' | 'WB' | 'LB' | 'F' | 'GF';
export type Half = 'I' | 'II';
export type MatchPhase = 'pre' | 'H1' | 'HT' | 'H2' | 'FT';

export interface MatchClock {
  phase: MatchPhase;
  phaseStartedAt: number | null;
  elapsedMsAtPhaseStart: number;
  running: boolean;
}

export interface Player {
  name: string;
  is_captain?: boolean;
}

export interface Team {
  id: string;
  code: string;
  displayName: string;
  grade: number;
  class: string;
  division: Division;
  captain: string;
  contactEmail?: string;
  playersCount: number;
  players: Player[];
  color?: string | null;
  crestUrl?: string | null;
}

export interface Goal {
  id: string;
  playerName: string;
  teamId: string;
  minute: number;
  half: Half;
  createdAt?: number;
}

export type CardColor = 'yellow' | 'red';

export interface Card {
  id: string;
  playerName: string;
  teamId: string;
  color: CardColor;
  minute: number;
  half: Half;
  createdAt?: number;
}

export interface Match {
  id: string;
  stage: Stage;
  bracketSlot?: string | null;
  date: string;
  time: string;
  label?: string;
  homeId: string;
  awayId: string;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  winnerId: string | null;
  penalties: { home: number; away: number } | null;
  durationMin: number;
  updatedAt?: number;
  commentary?: string;
  mvpName?: string;
  mvpTeamId?: string;
  clock?: MatchClock | null;
}
