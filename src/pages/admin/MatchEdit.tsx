import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  doc, updateDoc, addDoc, deleteDoc, collection, getDocs, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useCards, useGoals, useMatch, useTeam } from '../../lib/hooks';
import Loading from '../../components/Loading';
import type { CardColor, Goal, Half, MatchStatus } from '../../lib/types';
import { classNames } from '../../lib/utils';

export default function MatchEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const match = useMatch(id);
  const goals = useGoals(id);
  const cards = useCards(id);
  const home = useTeam(match?.homeId);
  const away = useTeam(match?.awayId);

  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [status, setStatus] = useState<MatchStatus>('scheduled');
  const [penaltiesOn, setPenaltiesOn] = useState(false);
  const [penHome, setPenHome] = useState(0);
  const [penAway, setPenAway] = useState(0);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [commentary, setCommentary] = useState('');
  const [mvpName, setMvpName] = useState('');
  const [mvpTeamId, setMvpTeamId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!match) return;
    setHomeScore(match.homeScore ?? 0);
    setAwayScore(match.awayScore ?? 0);
    setStatus(match.status);
    setPenaltiesOn(!!match.penalties);
    setPenHome(match.penalties?.home ?? 0);
    setPenAway(match.penalties?.away ?? 0);
    setWinnerId(match.winnerId ?? null);
    setCommentary(match.commentary ?? '');
    setMvpName(match.mvpName ?? '');
    setMvpTeamId(match.mvpTeamId ?? '');
  }, [match?.id]);

  if (match === undefined) return <Loading />;
  if (match === null) return <div>Utakmica nije pronađena.</div>;

  async function save() {
    if (!id) return;
    setSaving(true);
    let resolvedWinner = winnerId;
    if (status === 'finished') {
      if (homeScore > awayScore) resolvedWinner = match!.homeId;
      else if (awayScore > homeScore) resolvedWinner = match!.awayId;
      else if (penaltiesOn) {
        resolvedWinner = penHome > penAway ? match!.homeId : penAway > penHome ? match!.awayId : winnerId;
      }
    }
    await updateDoc(doc(db, 'matches', id), {
      homeScore, awayScore, status,
      penalties: penaltiesOn ? { home: penHome, away: penAway } : null,
      winnerId: status === 'finished' ? resolvedWinner : null,
      commentary: commentary.trim() || null,
      mvpName: mvpName.trim() || null,
      mvpTeamId: mvpName.trim() ? (mvpTeamId || null) : null,
      updatedAt: serverTimestamp(),
    });
    setWinnerId(resolvedWinner);
    setSavedAt(Date.now());
    setSaving(false);
  }

  async function resetMatch() {
    if (!id) return;
    if (!confirm('Poništiti rezultat i vratiti na "Planirano"? Golovi i kartoni ostaju.')) return;
    await updateDoc(doc(db, 'matches', id), {
      homeScore: 0, awayScore: 0, status: 'scheduled',
      penalties: null, winnerId: null,
      updatedAt: serverTimestamp(),
    });
    setHomeScore(0); setAwayScore(0); setStatus('scheduled');
    setPenaltiesOn(false); setPenHome(0); setPenAway(0); setWinnerId(null);
  }

  async function deleteMatch() {
    if (!id) return;
    if (!confirm('Obrisati utakmicu u cijelosti (uključujući golove i kartone)? Ovo se ne može poništiti.')) return;
    const batch = writeBatch(db);
    const gs = await getDocs(collection(db, 'matches', id, 'goals'));
    gs.forEach((g) => batch.delete(g.ref));
    const cs = await getDocs(collection(db, 'matches', id, 'cards'));
    cs.forEach((c) => batch.delete(c.ref));
    batch.delete(doc(db, 'matches', id));
    await batch.commit();
    nav('/admin');
  }

  async function clearAllGoals() {
    if (!id) return;
    if (!confirm('Obrisati sve golove ove utakmice?')) return;
    const batch = writeBatch(db);
    const gs = await getDocs(collection(db, 'matches', id, 'goals'));
    gs.forEach((g) => batch.delete(g.ref));
    await batch.commit();
  }

  return (
    <div>
      <Link to="/admin" className="font-cond text-xs uppercase tracking-widest text-black/40">← Sve utakmice</Link>
      <h1 className="font-display text-3xl mt-2 mb-4 tracking-wide">
        {home?.code ?? '?'} vs {away?.code ?? '?'}
      </h1>

      <div className="card p-5 mb-5">
        <div className="flex items-center gap-3 justify-center mb-4">
          <ScoreInput label={home?.code ?? 'Domaći'} value={homeScore} onChange={setHomeScore} />
          <span className="font-display text-3xl text-black/30">:</span>
          <ScoreInput label={away?.code ?? 'Gosti'} value={awayScore} onChange={setAwayScore} />
        </div>

        <div className="flex gap-2 justify-center mb-4">
          {(['scheduled', 'live', 'finished'] as MatchStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={classNames('pill', status === s ? 'bg-brand-dark text-white' : 'bg-black/5 text-black/55')}
            >
              {s === 'scheduled' ? 'Planirano' : s === 'live' ? 'Uživo' : 'Završeno'}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 justify-center mb-3 text-sm">
          <input type="checkbox" checked={penaltiesOn} onChange={(e) => setPenaltiesOn(e.target.checked)} />
          <span>Penali</span>
        </label>

        {penaltiesOn && (
          <div className="flex items-center gap-3 justify-center mb-4">
            <ScoreInput label="Pen. dom." value={penHome} onChange={setPenHome} />
            <span className="font-display text-2xl text-black/30">:</span>
            <ScoreInput label="Pen. gos." value={penAway} onChange={setPenAway} />
          </div>
        )}

        {status === 'finished' && (
          <div className="mb-4">
            <div className="font-cond text-xs uppercase tracking-widest text-black/40 mb-2 text-center">Pobjednik (mora postojati)</div>
            <div className="flex gap-2 justify-center">
              {[
                { id: match.homeId, label: home?.code ?? 'Domaći' },
                { id: match.awayId, label: away?.code ?? 'Gosti' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setWinnerId(t.id)}
                  className={classNames(
                    'pill',
                    winnerId === t.id ? 'bg-brand-blue text-white' : 'bg-black/5 text-black/55'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="font-cond text-xs uppercase tracking-widest text-black/40 mb-1">Komentar utakmice</div>
          <textarea
            value={commentary}
            onChange={(e) => setCommentary(e.target.value)}
            rows={3}
            placeholder="Kratki osvrt — vidljiv na javnoj stranici utakmice."
            className="input resize-y"
          />
        </div>

        <div className="mb-4">
          <div className="font-cond text-xs uppercase tracking-widest text-black/40 mb-1">MVP (igrač utakmice)</div>
          <input
            className="input mb-2"
            placeholder="Ime MVP-a (ostavi prazno ako nema)"
            value={mvpName}
            onChange={(e) => setMvpName(e.target.value)}
          />
          {mvpName.trim() && (
            <div className="flex gap-2">
              {[
                { id: match.homeId, label: home?.code ?? 'Domaći' },
                { id: match.awayId, label: away?.code ?? 'Gosti' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setMvpTeamId(t.id)}
                  className={classNames(
                    'pill flex-1 justify-center',
                    mvpTeamId === t.id ? 'bg-brand-blue text-white' : 'bg-black/5 text-black/55'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={save} disabled={saving} className="btn-primary w-full">
          {saving ? 'Spremanje...' : 'Spremi'}
        </button>
        {savedAt && <div className="text-center text-brand-blue text-xs mt-2 font-cond uppercase tracking-widest">Spremljeno</div>}

        <div className="mt-4 pt-4 border-t border-black/5 flex flex-col gap-2">
          <button onClick={resetMatch} className="btn-ghost w-full text-brand-blue">
            Poništi rezultat
          </button>
          <button onClick={clearAllGoals} className="btn-ghost w-full text-brand-red">
            Obriši sve golove
          </button>
          <button onClick={deleteMatch} className="btn-red w-full">
            Obriši utakmicu
          </button>
        </div>
      </div>

      <h2 className="font-cond font-extrabold text-xs tracking-widest uppercase text-black/45 mb-3">Golovi</h2>
      <GoalAdder matchId={id!} homeId={match.homeId} awayId={match.awayId} home={home} away={away} />
      <div className="mt-3 space-y-2 mb-6">
        {goals.map((g) => (
          <GoalRow key={g.id} matchId={id!} goal={g} home={home} away={away} homeId={match.homeId} awayId={match.awayId} />
        ))}
        {goals.length === 0 && <div className="text-sm text-black/40 text-center py-3">Još nema golova.</div>}
      </div>

      <h2 className="font-cond font-extrabold text-xs tracking-widest uppercase text-black/45 mb-3">Kartoni</h2>
      <CardAdder matchId={id!} homeId={match.homeId} awayId={match.awayId} home={home} away={away} />
      <div className="mt-3 space-y-2">
        {cards.map((c) => (
          <div key={c.id} className="card flex items-center gap-3 px-4 py-2.5">
            <span className={classNames(
              'w-5 h-6 rounded-sm shrink-0',
              c.color === 'yellow' ? 'bg-yellow-400' : 'bg-brand-red'
            )} />
            <span className="font-cond text-xs font-bold text-black/40 w-14">{c.minute}' {c.half}</span>
            <span className="flex-1 font-medium">{c.playerName}</span>
            <span className={classNames('pill', c.teamId === match.homeId ? 'bg-brand-blue/10 text-brand-blue' : 'bg-brand-red/10 text-brand-red')}>
              {c.teamId === match.homeId ? home?.code : away?.code}
            </span>
            <button onClick={() => deleteDoc(doc(db, 'matches', id!, 'cards', c.id))} className="text-black/30 hover:text-brand-red text-xs">×</button>
          </div>
        ))}
        {cards.length === 0 && <div className="text-sm text-black/40 text-center py-3">Nema kartona.</div>}
      </div>
    </div>
  );
}

function ScoreInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center">
      <div className="font-cond text-[10px] uppercase tracking-widest text-black/40 mb-1">{label}</div>
      <div className="flex items-center gap-2 bg-brand-dark text-white rounded-2xl px-2 py-1.5">
        <button onClick={() => onChange(Math.max(0, value - 1))} className="w-7 h-7 grid place-items-center text-lg">−</button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="font-display text-3xl bg-transparent text-center w-12 outline-none"
        />
        <button onClick={() => onChange(value + 1)} className="w-7 h-7 grid place-items-center text-lg">+</button>
      </div>
    </div>
  );
}

function GoalRow({ matchId, goal, home, away, homeId, awayId }: {
  matchId: string; goal: Goal; home: any; away: any; homeId: string; awayId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [player, setPlayer] = useState(goal.playerName);
  const [teamId, setTeamId] = useState(goal.teamId);
  const [minute, setMinute] = useState(goal.minute);
  const [half, setHalf] = useState<Half>(goal.half);

  async function saveRow() {
    await updateDoc(doc(db, 'matches', matchId, 'goals', goal.id), {
      playerName: player.trim(), teamId, minute, half,
    });
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="card flex items-center gap-3 px-4 py-2.5">
        <span className="font-cond text-xs font-bold text-black/40 w-14">{goal.minute}' {goal.half}</span>
        <span className="flex-1 font-medium">{goal.playerName}</span>
        <span className={classNames('pill', goal.teamId === homeId ? 'bg-brand-blue/10 text-brand-blue' : 'bg-brand-red/10 text-brand-red')}>
          {goal.teamId === homeId ? home?.code : away?.code}
        </span>
        <button onClick={() => setEditing(true)} className="text-black/40 hover:text-brand-blue text-xs font-cond uppercase tracking-wider">Uredi</button>
        <button onClick={() => { if (confirm('Obrisati gol?')) deleteDoc(doc(db, 'matches', matchId, 'goals', goal.id)); }} className="text-black/30 hover:text-brand-red text-xs">×</button>
      </div>
    );
  }

  return (
    <div className="card p-3 space-y-2">
      <div className="flex gap-2">
        <button type="button" onClick={() => setTeamId(homeId)} className={classNames('flex-1 pill', teamId === homeId ? 'bg-brand-blue text-white' : 'bg-black/5 text-black/55')}>{home?.code ?? 'D'}</button>
        <button type="button" onClick={() => setTeamId(awayId)} className={classNames('flex-1 pill', teamId === awayId ? 'bg-brand-red text-white' : 'bg-black/5 text-black/55')}>{away?.code ?? 'G'}</button>
      </div>
      <input className="input" value={player} onChange={(e) => setPlayer(e.target.value)} />
      <div className="flex gap-2">
        <input type="number" min={1} max={40} className="input" value={minute} onChange={(e) => setMinute(parseInt(e.target.value) || 1)} />
        <button type="button" onClick={() => setHalf('I')} className={classNames('pill', half === 'I' ? 'bg-brand-dark text-white' : 'bg-black/5 text-black/55')}>I.</button>
        <button type="button" onClick={() => setHalf('II')} className={classNames('pill', half === 'II' ? 'bg-brand-dark text-white' : 'bg-black/5 text-black/55')}>II.</button>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setEditing(false)} className="btn-ghost flex-1">Odustani</button>
        <button onClick={saveRow} className="btn-primary flex-1">Spremi</button>
      </div>
    </div>
  );
}

function GoalAdder({ matchId, homeId, awayId, home, away }: any) {
  const [player, setPlayer] = useState('');
  const [teamId, setTeamId] = useState(homeId);
  const [minute, setMinute] = useState(1);
  const [half, setHalf] = useState<Half>('I');
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!player.trim()) return;
    setBusy(true);
    await addDoc(collection(db, 'matches', matchId, 'goals'), {
      playerName: player.trim(),
      teamId,
      minute,
      half,
      createdAt: Date.now(),
    });
    setPlayer('');
    setBusy(false);
  }

  return (
    <form onSubmit={add} className="card p-4 space-y-3">
      <div className="flex gap-2">
        <button type="button" onClick={() => setTeamId(homeId)} className={classNames('flex-1 pill', teamId === homeId ? 'bg-brand-blue text-white' : 'bg-black/5 text-black/55')}>{home?.code ?? 'Domaći'}</button>
        <button type="button" onClick={() => setTeamId(awayId)} className={classNames('flex-1 pill', teamId === awayId ? 'bg-brand-red text-white' : 'bg-black/5 text-black/55')}>{away?.code ?? 'Gosti'}</button>
      </div>
      <input className="input" placeholder="Ime strijelca" value={player} onChange={(e) => setPlayer(e.target.value)} />
      <div className="flex gap-2">
        <input type="number" min={1} max={40} className="input" placeholder="Minuta" value={minute} onChange={(e) => setMinute(parseInt(e.target.value) || 1)} />
        <button type="button" onClick={() => setHalf('I')} className={classNames('pill', half === 'I' ? 'bg-brand-dark text-white' : 'bg-black/5 text-black/55')}>I. pol.</button>
        <button type="button" onClick={() => setHalf('II')} className={classNames('pill', half === 'II' ? 'bg-brand-dark text-white' : 'bg-black/5 text-black/55')}>II. pol.</button>
      </div>
      <button className="btn-primary w-full" disabled={busy || !player.trim()}>Dodaj gol</button>
    </form>
  );
}

function CardAdder({ matchId, homeId, awayId, home, away }: any) {
  const [player, setPlayer] = useState('');
  const [teamId, setTeamId] = useState(homeId);
  const [minute, setMinute] = useState(1);
  const [half, setHalf] = useState<Half>('I');
  const [color, setColor] = useState<CardColor>('yellow');
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!player.trim()) return;
    setBusy(true);
    await addDoc(collection(db, 'matches', matchId, 'cards'), {
      playerName: player.trim(), teamId, minute, half, color,
      createdAt: Date.now(),
    });
    setPlayer('');
    setBusy(false);
  }

  return (
    <form onSubmit={add} className="card p-4 space-y-3">
      <div className="flex gap-2">
        <button type="button" onClick={() => setTeamId(homeId)} className={classNames('flex-1 pill', teamId === homeId ? 'bg-brand-blue text-white' : 'bg-black/5 text-black/55')}>{home?.code ?? 'Domaći'}</button>
        <button type="button" onClick={() => setTeamId(awayId)} className={classNames('flex-1 pill', teamId === awayId ? 'bg-brand-red text-white' : 'bg-black/5 text-black/55')}>{away?.code ?? 'Gosti'}</button>
      </div>
      <input className="input" placeholder="Ime igrača" value={player} onChange={(e) => setPlayer(e.target.value)} />
      <div className="flex gap-2">
        <button type="button" onClick={() => setColor('yellow')} className={classNames('flex-1 pill', color === 'yellow' ? 'bg-yellow-400 text-black' : 'bg-black/5 text-black/55')}>Žuti</button>
        <button type="button" onClick={() => setColor('red')} className={classNames('flex-1 pill', color === 'red' ? 'bg-brand-red text-white' : 'bg-black/5 text-black/55')}>Crveni</button>
      </div>
      <div className="flex gap-2">
        <input type="number" min={1} max={40} className="input" placeholder="Minuta" value={minute} onChange={(e) => setMinute(parseInt(e.target.value) || 1)} />
        <button type="button" onClick={() => setHalf('I')} className={classNames('pill', half === 'I' ? 'bg-brand-dark text-white' : 'bg-black/5 text-black/55')}>I. pol.</button>
        <button type="button" onClick={() => setHalf('II')} className={classNames('pill', half === 'II' ? 'bg-brand-dark text-white' : 'bg-black/5 text-black/55')}>II. pol.</button>
      </div>
      <button className="btn-primary w-full" disabled={busy || !player.trim()}>Dodaj karton</button>
    </form>
  );
}
