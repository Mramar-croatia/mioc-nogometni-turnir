export type Division = 'Muški' | 'Ženski';
export type MatchStatus = 'scheduled' | 'live' | 'finished';
export type Stage = 'R1' | 'WB' | 'LB' | 'F' | 'GF';
export type Half = 'I' | 'II';

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
}

export interface Goal {
  id: string;
  playerName: string;
  teamId: string;
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
}

export interface BracketSlot {
  id: string;
  label: string;
  matchId?: string | null;
  teamId?: string | null;
  source?: { type: 'winner' | 'loser'; matchId: string }[];
}

export interface BracketStage2 {
  winnersBracket: BracketSlot[];
  losersBracket: BracketSlot[];
  final: BracketSlot;
  grandFinal: BracketSlot;
}
