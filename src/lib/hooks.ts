import { useEffect, useMemo, useState } from 'react';
import {
  collection, doc, onSnapshot, orderBy, query, getDoc,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './firebase';
import type { Team, Match, Goal, Card, Stage } from './types';
import { useTournamentData } from './TournamentData';
import { sortGoalsChronologically } from './goals';

function withId<T>(id: string, data: unknown): T {
  return { id, ...(data as object) } as T;
}

function normalizeStage(stage: unknown): Stage {
  if (stage === 'GF') return 'F';
  if (stage === 'R1' || stage === 'WB' || stage === 'LB' || stage === 'F') return stage;
  return 'R1';
}

function withNormalizedMatch(id: string, data: unknown): Match {
  const match = withId<Match>(id, data);
  return { ...match, stage: normalizeStage((data as { stage?: unknown }).stage) };
}

export function useTeams() {
  return useTournamentData().teams;
}

export function useTeam(id: string | undefined) {
  const { teams } = useTournamentData();
  return useMemo<Team | null | undefined>(() => {
    if (!id) return undefined;
    if (teams === null) return undefined;
    return teams.find((t) => t.id === id) ?? null;
  }, [teams, id]);
}

export function useMatches() {
  return useTournamentData().matches;
}

export function useMatch(id: string | undefined) {
  const [match, setMatch] = useState<Match | null | undefined>(undefined);
  useEffect(() => {
    if (!id) {
      setMatch(undefined);
      return;
    }
    return onSnapshot(doc(db, 'matches', id), (d) => {
      setMatch(d.exists() ? withNormalizedMatch(d.id, d.data()) : null);
    });
  }, [id]);
  return match;
}

export function useGoals(matchId: string | undefined) {
  const [goals, setGoals] = useState<Goal[]>([]);
  useEffect(() => {
    if (!matchId) {
      setGoals([]);
      return;
    }
    const q = query(collection(db, 'matches', matchId, 'goals'), orderBy('minute'));
    return onSnapshot(q, (snap) => {
      setGoals(sortGoalsChronologically(snap.docs.map((d) => withId<Goal>(d.id, d.data()))));
    });
  }, [matchId]);
  return goals;
}

export function useCards(matchId: string | undefined) {
  const [cards, setCards] = useState<Card[]>([]);
  useEffect(() => {
    if (!matchId) {
      setCards([]);
      return;
    }
    const q = query(collection(db, 'matches', matchId, 'cards'), orderBy('minute'));
    return onSnapshot(q, (snap) => {
      setCards(snap.docs.map((d) => withId<Card>(d.id, d.data())));
    }, () => setCards([]));
  }, [matchId]);
  return cards;
}

export function useAllGoals(_matches?: Match[] | null) {
  return useTournamentData().allGoals;
}

export function useAuthUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);
  return user;
}

export function useIsAdmin(user: User | null | undefined) {
  const [isAdmin, setIsAdmin] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    if (user === undefined) return;
    if (!user) { setIsAdmin(false); return; }
    let cancelled = false;
    getDoc(doc(db, 'admins', user.uid))
      .then((d) => { if (!cancelled) setIsAdmin(d.exists()); })
      .catch(() => { if (!cancelled) setIsAdmin(false); });
    return () => { cancelled = true; };
  }, [user]);
  return isAdmin;
}
