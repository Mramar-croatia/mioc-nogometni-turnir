import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  doc, updateDoc, addDoc, deleteDoc, collection, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useGoals, useMatch, useTeam } from '../../lib/hooks';
import Loading from '../../components/Loading';
import type { Half, MatchStatus } from '../../lib/types';
import { classNames } from '../../lib/utils';

export default function MatchEdit() {
  const { id } = useParams();
  const match = useMatch(id);
  const goals = useGoals(id);
  const home = useTeam(match?.homeId);
  const away = useTeam(match?.awayId);

  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [status, setStatus] = useState<MatchStatus>('scheduled');
  const [penaltiesOn, setPenaltiesOn] = useState(false);
  const [penHome, setPenHome] = useState(0);
  const [penAway, setPenAway] = useState(0);
  const [winnerId, setWinnerId] = useState<string | null>(null);
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
      updatedAt: serverTimestamp(),
    });
    setWinnerId(resolvedWinner);
    setSavedAt(Date.now());
    setSaving(false);
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

        <button onClick={save} disabled={saving} className="btn-primary w-full">
          {saving ? 'Spremanje...' : 'Spremi'}
        </button>
        {savedAt && <div className="text-center text-brand-blue text-xs mt-2 font-cond uppercase tracking-widest">Spremljeno</div>}
      </div>

      <h2 className="font-cond font-extrabold text-xs tracking-widest uppercase text-black/45 mb-3">Golovi</h2>
      <GoalAdder matchId={id!} homeId={match.homeId} awayId={match.awayId} home={home} away={away} />
      <div className="mt-3 space-y-2">
        {goals.map((g) => (
          <div key={g.id} className="card flex items-center gap-3 px-4 py-2.5">
            <span className="font-cond text-xs font-bold text-black/40 w-14">{g.minute}' {g.half}</span>
            <span className="flex-1 font-medium">{g.playerName}</span>
            <span className={classNames('pill', g.teamId === match.homeId ? 'bg-brand-blue/10 text-brand-blue' : 'bg-brand-red/10 text-brand-red')}>
              {g.teamId === match.homeId ? home?.code : away?.code}
            </span>
            <button onClick={() => deleteDoc(doc(db, 'matches', id!, 'goals', g.id))} className="text-black/30 hover:text-brand-red text-xs">×</button>
          </div>
        ))}
        {goals.length === 0 && <div className="text-sm text-black/40 text-center py-3">Još nema golova.</div>}
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
        <input type="number" min={1} max={20} className="input" placeholder="Minuta" value={minute} onChange={(e) => setMinute(parseInt(e.target.value) || 1)} />
        <button type="button" onClick={() => setHalf('I')} className={classNames('pill', half === 'I' ? 'bg-brand-dark text-white' : 'bg-black/5 text-black/55')}>I. pol.</button>
        <button type="button" onClick={() => setHalf('II')} className={classNames('pill', half === 'II' ? 'bg-brand-dark text-white' : 'bg-black/5 text-black/55')}>II. pol.</button>
      </div>
      <button className="btn-primary w-full" disabled={busy || !player.trim()}>Dodaj gol</button>
    </form>
  );
}
