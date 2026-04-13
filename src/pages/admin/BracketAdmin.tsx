import { useEffect, useState } from 'react';
import { doc, setDoc, addDoc, collection, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useBracketStage2, useMatches, useTeams } from '../../lib/hooks';
import Loading from '../../components/Loading';
import { Link } from 'react-router-dom';
import type { Stage } from '../../lib/types';
import { classNames } from '../../lib/utils';

const STAGE_OPTIONS: { value: Stage; label: string }[] = [
  { value: 'WB', label: 'Pobjednička' },
  { value: 'LB', label: 'Poražena' },
  { value: 'F', label: 'Finale' },
  { value: 'GF', label: 'Veliko finale' },
];

export default function BracketAdmin() {
  const teams = useTeams();
  const matches = useMatches();
  const stage2 = useBracketStage2();

  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:25');
  const [stage, setStage] = useState<Stage>('WB');
  const [label, setLabel] = useState('');
  const [homeId, setHomeId] = useState('');
  const [awayId, setAwayId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (stage2 === undefined) return;
    if (stage2 === null) {
      // initialize empty bracket scaffolding
      setDoc(doc(db, 'brackets', 'stage2'), {
        winnersBracket: [],
        losersBracket: [],
        final: { id: 'F', label: 'Finale', matchId: null },
        grandFinal: { id: 'GF', label: 'Veliko finale', matchId: null },
      });
    }
  }, [stage2]);

  if (teams === null || matches === null) return <Loading />;

  async function createMatch(e: React.FormEvent) {
    e.preventDefault();
    if (!homeId || !awayId || !date) return;
    setBusy(true);
    await addDoc(collection(db, 'matches'), {
      stage,
      bracketSlot: label || null,
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
    setHomeId(''); setAwayId(''); setLabel('');
    setBusy(false);
  }

  const stage2Matches = matches.filter((m) => m.stage !== 'R1');

  return (
    <div>
      <h1 className="font-display text-3xl mb-2 tracking-wide">Ladder — admin</h1>
      <p className="text-sm text-black/55 mb-5">Dodavanje utakmica II. faze (double elimination).</p>

      <form onSubmit={createMatch} className="card p-4 space-y-3 mb-6">
        <h2 className="font-cond font-extrabold text-xs uppercase tracking-widest text-black/50">Nova utakmica</h2>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
          <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} required />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STAGE_OPTIONS.map((s) => (
            <button key={s.value} type="button" onClick={() => setStage(s.value)} className={classNames('pill', stage === s.value ? 'bg-brand-dark text-white' : 'bg-black/5 text-black/55')}>{s.label}</button>
          ))}
        </div>
        <input className="input" placeholder="Oznaka kruga (npr. WB-SF1)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <select className="input" value={homeId} onChange={(e) => setHomeId(e.target.value)} required>
            <option value="">Domaći</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.code}</option>)}
          </select>
          <select className="input" value={awayId} onChange={(e) => setAwayId(e.target.value)} required>
            <option value="">Gosti</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.code}</option>)}
          </select>
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Spremanje...' : 'Dodaj utakmicu'}</button>
      </form>

      <h2 className="font-cond font-extrabold text-xs uppercase tracking-widest text-black/50 mb-3">Postojeće II. faze</h2>
      <div className="space-y-2">
        {stage2Matches.length === 0 && <div className="text-sm text-black/40">Još nema utakmica II. faze.</div>}
        {stage2Matches.map((m) => {
          const home = teams.find((t) => t.id === m.homeId);
          const away = teams.find((t) => t.id === m.awayId);
          return (
            <div key={m.id} className="card flex items-center gap-3 px-4 py-3">
              <span className="pill bg-brand-blue/10 text-brand-blue">{m.stage}{m.bracketSlot ? ` · ${m.bracketSlot}` : ''}</span>
              <span className="text-xs text-black/40 font-cond">{m.date} {m.time}</span>
              <div className="flex-1 flex items-center gap-2">
                <span className="font-display text-lg">{home?.code ?? '?'}</span>
                <span className="text-black/30">vs</span>
                <span className="font-display text-lg">{away?.code ?? '?'}</span>
              </div>
              <Link to={`/admin/utakmica/${m.id}`} className="font-cond text-xs uppercase tracking-widest text-brand-blue">Uredi</Link>
              <button onClick={() => confirm('Obrisati utakmicu?') && deleteDoc(doc(db, 'matches', m.id))} className="text-black/30 hover:text-brand-red text-xs">×</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
