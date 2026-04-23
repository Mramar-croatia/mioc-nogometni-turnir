import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { collection, collectionGroup, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { Goal, Match, Stage, Team } from './types';

type GoalWithMatchId = Goal & { matchId: string };

interface TournamentData {
  teams: Team[] | null;
  matches: Match[] | null;
  allGoals: GoalWithMatchId[] | null;
  refresh: () => Promise<void>;
  refreshing: boolean;
  lastFetchedAt: number | null;
}

const TournamentDataContext = createContext<TournamentData | null>(null);

const FOCUS_REFRESH_MIN_AGE_MS = 30_000;
const LIVE_POLL_INTERVAL_MS = 60_000;

function normalizeStage(stage: unknown): Stage {
  if (stage === 'GF') return 'F';
  if (stage === 'R1' || stage === 'WB' || stage === 'LB' || stage === 'F') return stage;
  return 'R1';
}

function withId<T>(id: string, data: unknown): T {
  return { id, ...(data as object) } as T;
}

async function fetchAll(): Promise<{
  teams: Team[];
  matches: Match[];
  allGoals: GoalWithMatchId[];
}> {
  const [teamsSnap, matchesSnap, goalsSnap] = await Promise.all([
    getDocs(collection(db, 'teams')),
    getDocs(collection(db, 'matches')),
    getDocs(collectionGroup(db, 'goals')),
  ]);

  const teams = teamsSnap.docs
    .map((d) => withId<Team>(d.id, d.data()))
    .sort((a, b) => a.code.localeCompare(b.code, 'hr'));

  const matches = matchesSnap.docs
    .map((d) => {
      const data = d.data();
      return { ...withId<Match>(d.id, data), stage: normalizeStage(data.stage) };
    })
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const allGoals = goalsSnap.docs.map((d) => ({
    ...withId<Goal>(d.id, d.data()),
    matchId: d.ref.parent.parent?.id ?? '',
  }));

  return { teams, matches, allGoals };
}

export function TournamentDataProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [allGoals, setAllGoals] = useState<GoalWithMatchId[] | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const inFlight = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async () => {
    if (inFlight.current) return inFlight.current;
    setRefreshing(true);
    const p = fetchAll()
      .then((data) => {
        setTeams(data.teams);
        setMatches(data.matches);
        setAllGoals(data.allGoals);
        setLastFetchedAt(Date.now());
      })
      .catch((err) => {
        console.error('TournamentData refresh failed:', err);
        setTeams((t) => t ?? []);
        setMatches((m) => m ?? []);
        setAllGoals((g) => g ?? []);
      })
      .finally(() => {
        setRefreshing(false);
        inFlight.current = null;
      });
    inFlight.current = p;
    return p;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => {
      if (lastFetchedAt == null || Date.now() - lastFetchedAt > FOCUS_REFRESH_MIN_AGE_MS) {
        refresh();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onFocus();
    });
    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh, lastFetchedAt]);

  const hasLive = useMemo(
    () => (matches ?? []).some((m) => m.status === 'live'),
    [matches]
  );

  useEffect(() => {
    if (!hasLive) return;
    const id = window.setInterval(() => refresh(), LIVE_POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [hasLive, refresh]);

  const value = useMemo<TournamentData>(
    () => ({ teams, matches, allGoals, refresh, refreshing, lastFetchedAt }),
    [teams, matches, allGoals, refresh, refreshing, lastFetchedAt]
  );

  return (
    <TournamentDataContext.Provider value={value}>
      {children}
    </TournamentDataContext.Provider>
  );
}

export function useTournamentData(): TournamentData {
  const ctx = useContext(TournamentDataContext);
  if (!ctx) {
    throw new Error('useTournamentData must be used inside <TournamentDataProvider>');
  }
  return ctx;
}
