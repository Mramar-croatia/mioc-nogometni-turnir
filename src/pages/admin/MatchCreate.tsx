import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTeams } from '../../lib/hooks';
import Loading from '../../components/Loading';
import type { Stage } from '../../lib/types';
import { classNames, todayIso } from '../../lib/utils';

const STAGE_OPTIONS: { value: Stage; label: string }[] = [
  { value: 'R1', label: 'I. kolo' },
  { value: 'WB', label: 'Pobjednička' },
  { value: 'LB', label: 'Poražena' },
  { value: 'F', label: 'Finale' },
  { value: 'GF', label: 'Veliko finale' },
];

export default function MatchCreate() {
  const teams = useTeams();
  const nav = useNavigate();

  const [stage, setStage] = useState<Stage>('R1');
  const [bracketSlot, setBracketSlot] = useState('');
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState('14:25');
  const [homeId, setHomeId] = useState('');
  const [awayId, setAwayId] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (teams === null) return <Loading />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (homeId === awayId) { setErr('Domaća i gostujuća ekipa moraju biti različite.'); return; }
    setBusy(true);
    try {
      const ref = await addDoc(collection(db, 'matches'), {
        stage,
        bracketSlot: bracketSlot || null,
        date,
        time,
        label: '',
        homeId,
        awayId,
        homeScore: 0,
        awayScore: 0,
        status: 'scheduled',
        winnerId: null,
        penalties: null,
        durationMin: 20,
      });
      nav(`/admin/utakmica/${ref.id}`);
    } catch (ex: any) {
      setErr(ex.message ?? 'Greška');
      setBusy(false);
    }
  }

  return (
    <div>
      <Link to="/admin" className="font-cond text-xs uppercase tracking-widest text-black/40">← Sve utakmice</Link>
      <h1 className="font-display text-3xl mt-2 mb-4 tracking-wide">Nova utakmica</h1>

      <form onSubmit={submit} className="card p-5 space-y-4">
        <div>
          <Label>Stadij</Label>
          <div className="flex flex-wrap gap-2">
            {STAGE_OPTIONS.map((s) => (
              <button key={s.value} type="button" onClick={() => setStage(s.value)}
                className={classNames('pill', stage === s.value ? 'bg-brand-dark text-white' : 'bg-black/5 text-black/55')}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {stage !== 'R1' && (
          <div>
            <Label>Oznaka kruga (npr. WB-SF1)</Label>
            <input className="input" value={bracketSlot} onChange={(e) => setBracketSlot(e.target.value)} placeholder="opcionalno" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div><Label>Datum</Label><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
          <div><Label>Vrijeme</Label><input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} required /></div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Domaći</Label>
            <select className="input" value={homeId} onChange={(e) => setHomeId(e.target.value)} required>
              <option value="">— odaberi —</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.code}</option>)}
            </select>
          </div>
          <div>
            <Label>Gosti</Label>
            <select className="input" value={awayId} onChange={(e) => setAwayId(e.target.value)} required>
              <option value="">— odaberi —</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.code}</option>)}
            </select>
          </div>
        </div>

        {err && <div className="text-brand-red text-sm">{err}</div>}

        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Spremanje...' : 'Stvori utakmicu'}
        </button>
      </form>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="font-cond text-xs uppercase tracking-widest text-black/50 mb-1">{children}</div>;
}
