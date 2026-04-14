import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTeam } from '../../lib/hooks';
import Loading from '../../components/Loading';
import type { Division, Player } from '../../lib/types';
import { classNames } from '../../lib/utils';

const EMPTY: {
  code: string;
  displayName: string;
  grade: number;
  class: string;
  division: Division;
  captain: string;
  contactEmail: string;
  players: Player[];
  color: string;
} = {
  code: '',
  displayName: '',
  grade: 1,
  class: '',
  division: 'Muški',
  captain: '',
  contactEmail: '',
  players: [],
  color: '',
};

const COLOR_PRESETS = [
  '', '#1d4e9e', '#d42a3c', '#13152a', '#0f8a4f', '#e6a700',
  '#8e24aa', '#00838f', '#f4511e', '#5d4037',
];

export default function TeamEdit() {
  const { id } = useParams();
  const isNew = !id;
  const existing = useTeam(isNew ? undefined : id);
  const nav = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [newPlayer, setNewPlayer] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !existing) return;
    setForm({
      code: existing.code,
      displayName: existing.displayName ?? existing.code,
      grade: existing.grade,
      class: existing.class,
      division: existing.division,
      captain: existing.captain,
      contactEmail: existing.contactEmail ?? '',
      players: existing.players ?? [],
      color: existing.color ?? '',
    });
  }, [existing, isNew]);

  if (!isNew && existing === undefined) return <Loading />;
  if (!isNew && existing === null) return <div className="text-center py-10">Ekipa nije pronađena.</div>;

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addPlayer() {
    if (!newPlayer.trim()) return;
    update('players', [...form.players, { name: newPlayer.trim(), is_captain: false }]);
    setNewPlayer('');
  }

  function removePlayer(i: number) {
    update('players', form.players.filter((_, idx) => idx !== i));
  }

  function toggleCaptain(i: number) {
    update('players', form.players.map((p, idx) => ({ ...p, is_captain: idx === i ? !p.is_captain : false })));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!form.code.trim()) {
      setErr('Šifra ekipe je obavezna.');
      return;
    }
    setBusy(true);
    try {
      const data = {
        code: form.code.trim(),
        displayName: form.displayName.trim() || form.code.trim(),
        grade: form.grade,
        class: form.class.trim(),
        division: form.division,
        captain: form.captain.trim(),
        contactEmail: form.contactEmail.trim() || null,
        playersCount: form.players.length,
        players: form.players,
        color: form.color || null,
        crestUrl: existing?.crestUrl ?? null,
      };

      if (isNew) {
        await addDoc(collection(db, 'teams'), data);
      } else {
        await setDoc(doc(db, 'teams', id!), data);
      }

      nav('/admin/ekipe');
    } catch (ex: any) {
      setErr(ex.message ?? 'Greška');
      setBusy(false);
    }
  }

  return (
    <div>
      <Link to="/admin/ekipe" className="font-cond text-xs uppercase tracking-widest text-black/40">← Sve ekipe</Link>
      <h1 className="font-display text-3xl mt-2 mb-4 tracking-wide">{isNew ? 'Nova ekipa' : `Uredi ${form.code}`}</h1>

      <form onSubmit={save} className="card p-5 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Šifra (npr. 1.A)</Label><input className="input" value={form.code} onChange={(e) => update('code', e.target.value)} required /></div>
          <div><Label>Prikazni naziv</Label><input className="input" value={form.displayName} onChange={(e) => update('displayName', e.target.value)} placeholder="isto kao šifra" /></div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div><Label>Razred</Label><input type="number" min={1} max={4} className="input" value={form.grade} onChange={(e) => update('grade', parseInt(e.target.value, 10) || 1)} /></div>
          <div><Label>Odjeljenje</Label><input className="input" value={form.class} onChange={(e) => update('class', e.target.value)} placeholder="A, B, C..." /></div>
        </div>

        <div>
          <Label>Divizija</Label>
          <div className="flex gap-2">
            {(['Muški', 'Ženski'] as Division[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => update('division', d)}
                className={classNames('pill flex-1', form.division === d ? 'bg-brand-dark text-white' : 'bg-black/5 text-black/55')}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Boja ekipe (opcionalno)</Label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c || 'none'}
                type="button"
                onClick={() => update('color', c)}
                className={classNames(
                  'w-8 h-8 rounded-full border-2 transition',
                  form.color === c ? 'border-brand-dark scale-110' : 'border-black/10'
                )}
                style={{ background: c || '#fff' }}
                title={c || 'Bez boje'}
              >
                {!c && <span className="text-black/30 text-xs">∅</span>}
              </button>
            ))}
            <input
              type="color"
              value={form.color || '#1d4e9e'}
              onChange={(e) => update('color', e.target.value)}
              className="w-10 h-10 rounded-xl border border-black/10 cursor-pointer"
              title="Vlastita boja"
            />
          </div>
        </div>

        <div><Label>Kapetan (ime)</Label><input className="input" value={form.captain} onChange={(e) => update('captain', e.target.value)} /></div>
        <div><Label>Kontakt email</Label><input type="email" className="input" value={form.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} /></div>

        <div>
          <Label>Igrači ({form.players.length})</Label>
          <div className="space-y-1.5 mb-2">
            {form.players.map((p, i) => (
              <div key={i} className="flex items-center gap-2 bg-black/5 rounded-xl px-3 py-2">
                <span className="flex-1 text-sm">{p.name}</span>
                <button
                  type="button"
                  onClick={() => toggleCaptain(i)}
                  className={classNames(
                    'text-[10px] font-cond uppercase tracking-widest px-2 py-0.5 rounded-full',
                    p.is_captain ? 'bg-brand-blue text-white' : 'text-black/40 hover:text-brand-blue'
                  )}
                >
                  Kapetan
                </button>
                <button type="button" onClick={() => removePlayer(i)} className="text-black/30 hover:text-brand-red text-lg leading-none">×</button>
              </div>
            ))}
            {form.players.length === 0 && <div className="text-sm text-black/40 italic">Nema igrača.</div>}
          </div>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Ime novog igrača"
              value={newPlayer}
              onChange={(e) => setNewPlayer(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPlayer(); } }}
            />
            <button type="button" onClick={addPlayer} className="btn-ghost">+ Dodaj</button>
          </div>
        </div>

        <div className="rounded-xl border border-black/8 bg-black/[0.02] p-4 text-sm text-black/55">
          Grb ekipe je uklonjen iz aplikacije. Ostaju samo osnovni podaci, boja ekipe i roster.
        </div>

        {err && <div className="text-brand-red text-sm">{err}</div>}

        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Spremanje...' : isNew ? 'Stvori ekipu' : 'Spremi izmjene'}
        </button>
      </form>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="font-cond text-xs uppercase tracking-widest text-black/50 mb-1">{children}</div>;
}
