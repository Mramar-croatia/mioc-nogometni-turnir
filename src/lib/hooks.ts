import { useEffect, useState } from 'react';
import {
  collection, doc, onSnapshot, orderBy, query, getDoc, getDocs, collectionGroup,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './firebase';
import type { Team, Match, Goal, Card, BracketStage2 } from './types';

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
    return onSnapshot(
      collection(db, 'matches'),
      (snap) => {
        const list: Match[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
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

export function useCards(matchId: string | undefined) {
  const [cards, setCards] = useState<Card[]>([]);
  useEffect(() => {
    if (!matchId) return;
    const q = query(collection(db, 'matches', matchId, 'cards'), orderBy('minute'));
    return onSnapshot(q, (snap) => {
      setCards(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    }, () => setCards([]));
  }, [matchId]);
  return cards;
}

// Aggregates every goal across every match. Tries a collection-group query
// first (fast, one round-trip); falls back to per-match reads if rules
// aren't deployed yet.
export function useAllGoals(matches: Match[] | null) {
  const [goals, setGoals] = useState<(Goal & { matchId: string })[] | null>(null);
  useEffect(() => {
    if (matches === null) return;
    if (matches.length === 0) { setGoals([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(collectionGroup(db, 'goals'));
        if (cancelled) return;
        const list = snap.docs.map((d) => ({
          id: d.id, matchId: d.ref.parent.parent?.id ?? '', ...(d.data() as any),
        })) as (Goal & { matchId: string })[];
        setGoals(list);
      } catch {
        try {
          const all = await Promise.all(matches.map((m) =>
            getDocs(collection(db, 'matches', m.id, 'goals')).then((s) =>
              s.docs.map((d) => ({ id: d.id, matchId: m.id, ...(d.data() as any) }))
            )
          ));
          if (!cancelled) setGoals(all.flat() as any);
        } catch {
          if (!cancelled) setGoals([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [matches]);
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
