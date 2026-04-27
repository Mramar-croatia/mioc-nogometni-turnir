export const BRACKET_BLUE = '#1d4e9e';
export const BRACKET_RED = '#d42a3c';
export const BRACKET_DARK = '#13152a';

export type BranchId = 'GG' | 'DG' | 'VF';

export interface ByePlan {
  id: string;
  label: string;
  hint: string;
  flow: string;
}

export interface RoundPlan {
  title: string;
  numbers: string[];
  note?: string;
  byes?: ByePlan[];
}

export interface BranchPlan {
  id: BranchId;
  title: string;
  short: string;
  subtitle: string;
  accent: string;
  accentTint: string;
  rounds: RoundPlan[];
}

export const DEFAULT_BYE_TEAM_CODES = ['4.G', '3.F', '3.MN'] as const;

export const MATCH_FLOW: Record<string, string> = {
  U1: 'Pobj. → U6 · Gub. → U12',
  U2: 'Pobj. → U7 · Gub. → U13',
  U3: 'Pobj. → U9 · Gub. → U10',
  U4: 'Pobj. → U9 · Gub. → U10',
  U5: 'Pobj. → U8 · Gub. → U11',
  U6: 'Pobj. → U15 · Gub. → U11',
  U7: 'Pobj. → U15 · Gub. → U14',
  U8: 'Pobj. → U16 · Gub. → U12',
  U9: 'Pobj. → U16 · Gub. → U13',
  U10: 'Pobj. → U14',
  U11: 'Pobj. → U17',
  U12: 'Pobj. → U17',
  U13: 'Pobj. → U18',
  U14: 'Pobj. → U18',
  U15: 'Pobj. → U21 · Gub. → U20',
  U16: 'Pobj. → U21 · Gub. → U19',
  U17: 'Pobj. → U19',
  U18: 'Pobj. → U20',
  U19: 'Pobj. → U22',
  U20: 'Pobj. → U22',
  U21: 'Pobj. → U24 · Gub. → U23',
  U22: 'Pobj. → U23',
  U23: 'Pobj. → U24 (veliko finale)',
  U24: 'Ako DG pobijedi → U25',
  U25: 'Pobjednik = prvak turnira',
};

export const MATCH_HINTS: Record<string, [string, string]> = {
  U6: ['Prolaz 1', 'Pobj. U1'],
  U7: ['Pobj. U2', 'Prolaz 2'],
  U8: ['Prolaz 3', 'Pobj. U5'],
  U9: ['Pobj. U3', 'Pobj. U4'],
  U10: ['Gubitnik U3', 'Gubitnik U4'],
  U11: ['Gubitnik U5', 'Gubitnik U6'],
  U12: ['Gubitnik U1', 'Gubitnik U8'],
  U13: ['Gubitnik U2', 'Gubitnik U9'],
  U14: ['Gubitnik U7', 'Pobj. U10'],
  U15: ['Pobj. U6', 'Pobj. U7'],
  U16: ['Pobj. U9', 'Pobj. U8'],
  U17: ['Pobj. U11', 'Pobj. U12'],
  U18: ['Pobj. U13', 'Pobj. U14'],
  U19: ['Gubitnik U16', 'Pobj. U17'],
  U20: ['Pobj. U18', 'Gubitnik U15'],
  U21: ['Pobj. U15', 'Pobj. U16'],
  U22: ['Pobj. U19', 'Pobj. U20'],
  U23: ['Gubitnik U21', 'Pobj. U22'],
  U24: ['Pobjednik GG (U21)', 'Pobjednik DG (U23)'],
  U25: ['Pobjednik GG (U21)', 'Pobjednik DG (U23)'],
};

export const BRANCHES: BranchPlan[] = [
  {
    id: 'GG',
    title: 'Pobjednička grana',
    short: 'GG',
    subtitle: 'Put prema finalu bez poraza',
    accent: BRACKET_BLUE,
    accentTint: 'rgba(29,78,158,0.08)',
    rounds: [
      {
        title: '1. krug',
        numbers: ['U1', 'U2', 'U3', 'U4', 'U5'],
        byes: [
          { id: 'bye-1', label: 'Prolaz 1', hint: 'Prva slobodna momčad', flow: 'Ide u U6' },
          { id: 'bye-2', label: 'Prolaz 2', hint: 'Druga slobodna momčad', flow: 'Ide u U7' },
          { id: 'bye-3', label: 'Prolaz 3', hint: 'Treća slobodna momčad', flow: 'Ide u U8' },
        ],
      },
      { title: 'Četvrtfinale GG', numbers: ['U6', 'U7', 'U8', 'U9'] },
      { title: 'Polufinale GG', numbers: ['U15', 'U16'] },
      { title: 'Finale gornje grane', numbers: ['U21'] },
    ],
  },
  {
    id: 'DG',
    title: 'Gubitnička grana',
    short: 'DG',
    subtitle: 'Druga šansa do finala',
    accent: BRACKET_RED,
    accentTint: 'rgba(212,42,60,0.08)',
    rounds: [
      { title: '1. krug DG', numbers: ['U10', 'U11', 'U12', 'U13'] },
      { title: '2. krug DG', numbers: ['U14'] },
      { title: '3. krug DG', numbers: ['U17', 'U18'] },
      { title: '4. krug DG', numbers: ['U19', 'U20'] },
      { title: 'Polufinale DG', numbers: ['U22'] },
      { title: 'Finale donje grane', numbers: ['U23'] },
    ],
  },
  {
    id: 'VF',
    title: 'Veliko finale',
    short: 'VF',
    subtitle: 'Završni duel dviju grana',
    accent: BRACKET_DARK,
    accentTint: 'rgba(19,21,42,0.08)',
    rounds: [
      { title: 'Veliko finale', numbers: ['U24'] },
      {
        title: 'Reset finala',
        numbers: ['U25'],
        note: 'Igra se samo ako pobjednik donje grane pobijedi u U24 — dvostruka eliminacija zahtijeva dva poraza prvaka.',
      },
    ],
  },
];

export const PLANNED_NUMBERS = new Set(BRANCHES.flatMap((b) => b.rounds.flatMap((r) => r.numbers)));
