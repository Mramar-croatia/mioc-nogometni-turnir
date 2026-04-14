import { useEffect, useState } from 'react';

const KEY = 'mioc.followed.teams.v1';

function read(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function write(set: Set<string>) {
  localStorage.setItem(KEY, JSON.stringify(Array.from(set)));
  window.dispatchEvent(new Event('mioc.followed.changed'));
}

export function useFollowedTeams() {
  const [ids, setIds] = useState<Set<string>>(() => read());
  useEffect(() => {
    const refresh = () => setIds(read());
    window.addEventListener('mioc.followed.changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('mioc.followed.changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  return {
    ids,
    isFollowed: (id: string) => ids.has(id),
    toggle: (id: string) => {
      const next = new Set(ids);
      if (next.has(id)) next.delete(id); else next.add(id);
      write(next);
      setIds(next);
    },
  };
}
