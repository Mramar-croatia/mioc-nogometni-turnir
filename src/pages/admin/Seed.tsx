import { useState } from 'react';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function Seed() {
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  function add(line: string) {
    setLog((l) => [...l, line]);
  }

  async function run() {
    setBusy(true);
    setLog([]);
    setDone(false);
    try {
      const base = import.meta.env.BASE_URL;
      add('Učitavam data.json...');
      const res = await fetch(`${base}data.json`);
      const data = await res.json();

      add(`Pronađeno ekipa: ${data.teams.length}`);
      const batch1 = writeBatch(db);
      for (const t of data.teams) {
        batch1.set(doc(db, 'teams', String(t.id)), {
          code: t.team_code,
          displayName: t.display_name,
          grade: t.grade,
          class: t.class,
          division: t.division,
          captain: t.captain,
          contactEmail: t.contact_email ?? null,
          playersCount: t.players_count,
          players: t.players,
        });
      }
      await batch1.commit();
      add('Ekipe spremljene ✓');

      add(`Pronađeno utakmica: ${data.matches.length}`);
      const batch2 = writeBatch(db);
      for (const m of data.matches) {
        batch2.set(doc(db, 'matches', m.match_id), {
          stage: 'R1',
          bracketSlot: null,
          date: m.date,
          time: m.time,
          label: m.label,
          homeId: String(m.team1_id),
          awayId: String(m.team2_id),
          homeScore: 0,
          awayScore: 0,
          status: 'scheduled',
          winnerId: null,
          penalties: null,
          durationMin: 20,
        });
      }
      await batch2.commit();
      add('Utakmice spremljene ✓');

      await setDoc(doc(db, 'tournament', 'meta'), {
        name: data.tournament.name,
        year: data.tournament.year,
        organizer: data.tournament.organizer,
        currentStage: 'stage1',
      });
      add('Meta podaci spremljeni ✓');

      setDone(true);
    } catch (ex: any) {
      add(`Greška: ${ex.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-2 tracking-wide">Inicijalizacija</h1>
      <p className="text-sm text-black/55 mb-5">
        Učitava ekipe i raspored I. kola iz <code>data.json</code>. Pokrenuti samo jednom (bilo koje ponovno pokretanje će prepisati podatke).
      </p>

      <button onClick={run} disabled={busy} className="btn-primary mb-4">
        {busy ? 'Učitavanje...' : 'Pokreni inicijalizaciju'}
      </button>

      {log.length > 0 && (
        <div className="card p-4 font-mono text-sm space-y-1">
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}

      {done && <div className="text-brand-blue mt-4 font-cond uppercase tracking-widest">Gotovo.</div>}
    </div>
  );
}
