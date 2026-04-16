import { useEffect, useState } from 'react';
import type { Match, MatchClock, MatchPhase, Half } from './types';

export const DEFAULT_CLOCK: MatchClock = {
  phase: 'pre',
  phaseStartedAt: null,
  elapsedMsAtPhaseStart: 0,
  running: false,
};

export const PHASE_LABEL: Record<MatchPhase, string> = {
  pre: 'Prije početka',
  H1: '1. poluvrijeme',
  HT: 'Poluvrijeme',
  H2: '2. poluvrijeme',
  FT: 'Završeno',
};

export const PHASE_LABEL_SHORT: Record<MatchPhase, string> = {
  pre: 'PRIJE',
  H1: '1. POL.',
  HT: 'POLUVR.',
  H2: '2. POL.',
  FT: 'KRAJ',
};

export function getClock(match: Pick<Match, 'clock'> | null | undefined): MatchClock {
  return match?.clock ?? DEFAULT_CLOCK;
}

export function computePhaseElapsedMs(clock: MatchClock, now: number): number {
  if (clock.running && clock.phaseStartedAt != null) {
    return clock.elapsedMsAtPhaseStart + Math.max(0, now - clock.phaseStartedAt);
  }
  return clock.elapsedMsAtPhaseStart;
}

export function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function currentHalfAndMinute(
  clock: MatchClock,
  now: number,
): { half: Half; minute: number } | null {
  const elapsedMin = Math.floor(computePhaseElapsedMs(clock, now) / 60000) + 1;
  if (clock.phase === 'H1') return { half: 'I', minute: Math.max(1, elapsedMin) };
  if (clock.phase === 'H2') return { half: 'II', minute: Math.max(1, elapsedMin) };
  return null;
}

export function useMatchClock(match: Pick<Match, 'clock'> | null | undefined) {
  const clock = getClock(match);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!clock.running) {
      setNow(Date.now());
      return;
    }
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [clock.running, clock.phaseStartedAt]);
  const elapsedMs = computePhaseElapsedMs(clock, now);
  return {
    clock,
    elapsedMs,
    phase: clock.phase,
    running: clock.running,
    phaseLabel: PHASE_LABEL[clock.phase],
    phaseLabelShort: PHASE_LABEL_SHORT[clock.phase],
    displayTime: formatClock(elapsedMs),
    liveMinute: currentHalfAndMinute(clock, now),
  };
}

export function startFirstHalf(now: number): MatchClock {
  return { phase: 'H1', phaseStartedAt: now, elapsedMsAtPhaseStart: 0, running: true };
}

export function pauseClock(clock: MatchClock, now: number): MatchClock {
  if (!clock.running) return clock;
  return {
    ...clock,
    elapsedMsAtPhaseStart: computePhaseElapsedMs(clock, now),
    phaseStartedAt: null,
    running: false,
  };
}

export function resumeClock(clock: MatchClock, now: number): MatchClock {
  if (clock.running) return clock;
  return { ...clock, phaseStartedAt: now, running: true };
}

export function endFirstHalf(now: number): MatchClock {
  return { phase: 'HT', phaseStartedAt: now, elapsedMsAtPhaseStart: 0, running: true };
}

export function startSecondHalf(now: number): MatchClock {
  return { phase: 'H2', phaseStartedAt: now, elapsedMsAtPhaseStart: 0, running: true };
}

export function endMatchClock(clock: MatchClock, now: number): MatchClock {
  return {
    phase: 'FT',
    phaseStartedAt: null,
    elapsedMsAtPhaseStart: computePhaseElapsedMs(clock, now),
    running: false,
  };
}

export function resetClock(): MatchClock {
  return { ...DEFAULT_CLOCK };
}
