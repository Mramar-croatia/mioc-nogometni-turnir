import { useEffect, useState } from 'react';
import {
  collection, doc, onSnapshot, orderBy, query, getDoc, collectionGroup,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './firebase';
import type { Team, Match, Goal, Card } from './types';

function withId<T>(id: string, data: unknown): T {
  return { id, ...(data as object) } as T;
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  useEffect(() => {
    const q = query(collection(db, 'teams'));
    return onSnapshot(q, (snap) => {
      const list: Team[] = snap.docs.map((d) => withId<Team>(d.id, d.data()));
      list.sort((a, b) => a.code.localeCompare(b.code, 'hr'));
      setTeams(list);
    }, () => setTeams([]));
  }, []);
  return teams;
}

export function useTeam(id: string | undefined) {
  const [team, setTeam] = useState<Team | null | undefined>(undefined);
  useEffect(() => {
    if (!id) {
      setTeam(undefined);
      return;
    }
    return onSnapshot(doc(db, 'teams', id), (d) => {
      setTeam(d.exists() ? withId<Team>(d.id, d.data()) : null);
    });
  }, [id]);
  return team;
}

export function useMatches() {
  const [matches, setMatches] = useState<Match[] | null>(null);
  useEffect(() => {
    return onSnapshot(
      collection(db, 'matches'),
      (snap) => {
        const list: Match[] = snap.docs.map((d) => withId<Match>(d.id, d.data()));
        list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
        setMatches(list);
      },
      (err) => {
        console.error('useMatches error:', err);
        setMatches([]);
      }
    );
  }, []);
  return matches;
}

export function useMatch(id: string | undefined) {
  const [match, setMatch] = useState<Match | null | undefined>(undefined);
  useEffect(() => {
    if (!id) {
      setMatch(undefined);
      return;
    }
    return onSnapshot(doc(db, 'matches', id), (d) => {
      setMatch(d.exists() ? withId<Match>(d.id, d.data()) : null);
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
      setGoals(snap.docs.map((d) => withId<Goal>(d.id, d.data())));
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

// Aggregates every goal across every match in realtime.
export function useAllGoals(matches: Match[] | null) {
  const [goals, setGoals] = useState<(Goal & { matchId: string })[] | null>(null);
  useEffect(() => {
    if (matches === null) return;
    if (matches.length === 0) { setGoals([]); return; }
    return onSnapshot(
      collectionGroup(db, 'goals'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          ...withId<Goal>(d.id, d.data()),
          matchId: d.ref.parent.parent?.id ?? '',
        }));
        setGoals(list);
      },
      () => setGoals([])
    );
  }, [matches]);
  return goals;
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
