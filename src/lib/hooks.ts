import { useEffect, useState } from 'react';
import {
  collection, doc, onSnapshot, orderBy, query, getDoc,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './firebase';
import type { Team, Match, Goal, BracketStage2 } from './types';

export function useTeams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  useEffect(() => {
    const q = query(collection(db, 'teams'));
    return onSnapshot(q, (snap) => {
      const list: Team[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => a.code.localeCompare(b.code, 'hr'));
      setTeams(list);
    }, () => setTeams([]));
  }, []);
  return teams;
}

export function useTeam(id: string | undefined) {
  const [team, setTeam] = useState<Team | null | undefined>(undefined);
  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, 'teams', id), (d) => {
      setTeam(d.exists() ? ({ id: d.id, ...(d.data() as any) }) : null);
    });
  }, [id]);
  return team;
}

export function useMatches() {
  const [matches, setMatches] = useState<Match[] | null>(null);
  useEffect(() => {
    const q = query(collection(db, 'matches'), orderBy('date'), orderBy('time'));
    return onSnapshot(q, (snap) => {
      const list: Match[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setMatches(list);
    }, () => setMatches([]));
  }, []);
  return matches;
}

export function useMatch(id: string | undefined) {
  const [match, setMatch] = useState<Match | null | undefined>(undefined);
  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, 'matches', id), (d) => {
      setMatch(d.exists() ? ({ id: d.id, ...(d.data() as any) }) : null);
    });
  }, [id]);
  return match;
}

export function useGoals(matchId: string | undefined) {
  const [goals, setGoals] = useState<Goal[]>([]);
  useEffect(() => {
    if (!matchId) return;
    const q = query(collection(db, 'matches', matchId, 'goals'), orderBy('minute'));
    return onSnapshot(q, (snap) => {
      setGoals(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
  }, [matchId]);
  return goals;
}

export function useBracketStage2() {
  const [b, setB] = useState<BracketStage2 | null | undefined>(undefined);
  useEffect(() => {
    return onSnapshot(doc(db, 'brackets', 'stage2'), (d) => {
      setB(d.exists() ? (d.data() as BracketStage2) : null);
    });
  }, []);
  return b;
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
