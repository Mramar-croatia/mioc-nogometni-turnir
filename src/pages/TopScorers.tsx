import { useEffect, useState } from 'react';
import { collectionGroup, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTeams } from '../lib/hooks';
import Loading from '../components/Loading';

interface Row {
  player: string;
  teamId: string;
  goals: number;
}

export default function TopScorers() {
  const teams = useTeams();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collectionGroup(db, 'goals'));
        const counts = new Map<string, Row>();
        snap.forEach((d) => {
          const g = d.data() as any;
          const key = `${g.teamId}|${g.playerName}`;
          const existing = counts.get(key);
          if (existing) existing.goals += 1;
          else counts.set(key, { player: g.playerName, teamId: g.teamId, goals: 1 });
        });
        setRows(Array.from(counts.values()).sort((a, b) => b.goals - a.goals));
      } catch {
        setRows([]);
      }
    })();
  }, []);

  if (rows === null || teams === null) return <Loading />;
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  return (
    <div>
      <h1 className="font-display text-4xl mb-5 tracking-wide">Strijelci</h1>

      {rows.length === 0 && (
        <div className="card p-6 text-center text-black/50">Još nema golova.</div>
      )}

      <div className="card divide-y divide-black/5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="font-display text-2xl text-black/30 w-7 text-center">{i + 1}</div>
            <div className="flex-1">
              <div className="font-bold">{r.player}</div>
              <div className="text-xs text-black/40 font-cond tracking-wider uppercase">
                {teamMap.get(r.teamId)?.code ?? r.teamId}
              </div>
            </div>
            <div className="font-display text-2xl text-brand-blue">{r.goals}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
