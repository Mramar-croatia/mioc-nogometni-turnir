import type { Goal } from './types';

const HALF_ORDER: Record<Goal['half'], number> = {
  I: 0,
  II: 1,
};

export function compareGoalsChronologically(a: Goal, b: Goal) {
  return HALF_ORDER[a.half] - HALF_ORDER[b.half]
    || a.minute - b.minute
    || (a.createdAt ?? 0) - (b.createdAt ?? 0)
    || a.id.localeCompare(b.id);
}

export function sortGoalsChronologically(goals: Goal[]) {
  return [...goals].sort(compareGoalsChronologically);
}
