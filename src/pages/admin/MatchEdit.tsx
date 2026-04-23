import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  doc, updateDoc, addDoc, deleteDoc, collection, getDocs, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useCards, useGoals, useMatch, useTeam } from '../../lib/hooks';
import Loading from '../../components/Loading';
import type { CardColor, Goal, Half, Match, MatchStatus, Team } from '../../lib/types';
import { classNames } from '../../lib/utils';
import {
  endFirstHalf,
  endMatchClock,
  getClock,
  pauseClock,
  resetClock,
  resumeClock,
  startFirstHalf,
  startSecondHalf,
  useMatchClock,
} from '../../lib/matchClock';

type SideTeam = Team | null | undefined;

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
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState<MatchStatus>('scheduled');
  const [penaltiesOn, setPenaltiesOn] = useState(false);
  const [penHome, setPenHome] = useState(0);
  const [penAway, setPenAway] = useState(0);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [commentary, setCommentary] = useState('');
  const [mvpName, setMvpName] = useState('');
  const [mvpTeamId, setMvpTeamId] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!match) return;
    setHomeScore(match.homeScore ?? 0);
    setAwayScore(match.awayScore ?? 0);
    setDate(match.date ?? '');
    setTime(match.time ?? '');
    setStatus(match.status);
    setPenaltiesOn(!!match.penalties);
    setPenHome(match.penalties?.home ?? 0);
    setPenAway(match.penalties?.away ?? 0);
    setWinnerId(match.winnerId ?? null);
    setCommentary(match.commentary ?? '');
    setMvpName(match.mvpName ?? '');
    setMvpTeamId(match.mvpTeamId ?? '');
    setErr(null);
    setSavedAt(null);
  }, [match]);

  const homePlayers = useMemo(() => playerNames(home), [home]);
  const awayPlayers = useMemo(() => playerNames(away), [away]);
  const allPlayers = useMemo(
    () => Array.from(new Set([...homePlayers, ...awayPlayers])).sort((a, b) => a.localeCompare(b, 'hr')),
    [homePlayers, awayPlayers]
  );

  if (match === undefined) return <Loading />;
  if (match === null) return <div>Utakmica nije pronađena.</div>;

  const { homeId, awayId } = match;

  const resolvedWinnerId = resolveWinner({
    status,
    homeScore,
    awayScore,
    penaltiesOn,
    penHome,
    penAway,
    homeId,
    awayId,
    manualWinnerId: winnerId,
  });

  const inferredMvpTeamId = inferTeamIdForPlayer(mvpName, homeId, awayId, home, away);
  const effectiveMvpTeamId = mvpName.trim() ? (mvpTeamId || inferredMvpTeamId) : '';

  function touchForm() {
    setSavedAt(null);
    setErr(null);
  }

  function handleMvpNameChange(value: string) {
    touchForm();
    setMvpName(value);
    const inferred = inferTeamIdForPlayer(value, homeId, awayId, home, away);
    if (inferred) setMvpTeamId(inferred);
  }

  async function save() {
    if (!id) return;
    touchForm();
    setSaving(true);

    const normalizedMvpName = mvpName.trim();
    const nextWinnerId = resolveWinner({
      status,
      homeScore,
      awayScore,
      penaltiesOn,
      penHome,
      penAway,
      homeId,
      awayId,
      manualWinnerId: winnerId,
    });

    if (status === 'finished' && !nextWinnerId) {
      setErr('Za završenu neriješenu utakmicu unesi penale ili ručno odaberi pobjednika.');
      setSaving(false);
      return;
    }

    try {
      await updateDoc(doc(db, 'matches', id), {
        date,
        time,
        homeScore,
        awayScore,
        status,
        penalties: penaltiesOn ? { home: penHome, away: penAway } : null,
        winnerId: nextWinnerId,
        commentary: commentary.trim() || null,
        mvpName: normalizedMvpName || null,
        mvpTeamId: normalizedMvpName ? (effectiveMvpTeamId || null) : null,
        updatedAt: serverTimestamp(),
      });
      setWinnerId(nextWinnerId);
      setSavedAt(Date.now());
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Spremanje nije uspjelo.');
    } finally {
      setSaving(false);
    }
  }

  async function resetMatch() {
    if (!id) return;
    if (!confirm('Poništiti rezultat i vratiti na "Planirano"? Golovi i kartoni ostaju.')) return;
    await updateDoc(doc(db, 'matches', id), {
      homeScore: 0,
      awayScore: 0,
      status: 'scheduled',
      penalties: null,
      winnerId: null,
      clock: resetClock(),
      updatedAt: serverTimestamp(),
    });
    setHomeScore(0);
    setAwayScore(0);
    setStatus('scheduled');
    setPenaltiesOn(false);
    setPenHome(0);
    setPenAway(0);
    setWinnerId(null);
    setSavedAt(null);
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

      <MatchClockCard matchId={id!} match={match} />

      <div className="card p-5 mb-5">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <div className="font-cond text-xs uppercase tracking-widest text-black/40 mb-1 text-center">Datum</div>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => { touchForm(); setDate(e.target.value); }}
              required
            />
          </div>
          <div>
            <div className="font-cond text-xs uppercase tracking-widest text-black/40 mb-1 text-center">Vrijeme</div>
            <input
              type="time"
              className="input"
              value={time}
              onChange={(e) => { touchForm(); setTime(e.target.value); }}
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-3 justify-center mb-4">
          <ScoreInput label={home?.code ?? 'Domaći'} value={homeScore} onChange={(value) => { touchForm(); setHomeScore(value); }} />
          <span className="font-display text-3xl text-black/30">:</span>
          <ScoreInput label={away?.code ?? 'Gosti'} value={awayScore} onChange={(value) => { touchForm(); setAwayScore(value); }} />
        </div>

        <div className="flex gap-2 justify-center mb-4">
          {(['scheduled', 'live', 'finished'] as MatchStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => { touchForm(); setStatus(s); }}
              className={classNames('pill', status === s ? 'bg-brand-dark text-white' : 'bg-black/5 text-black/55')}
            >
              {s === 'scheduled' ? 'Planirano' : s === 'live' ? 'Uživo' : 'Završeno'}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 justify-center mb-3 text-sm">
          <input
            type="checkbox"
            checked={penaltiesOn}
            onChange={(e) => { touchForm(); setPenaltiesOn(e.target.checked); }}
          />
          <span>Penali</span>
        </label>

        {penaltiesOn && (
          <div className="flex items-center gap-3 justify-center mb-4">
            <ScoreInput label="Pen. dom." value={penHome} onChange={(value) => { touchForm(); setPenHome(value); }} />
            <span className="font-display text-2xl text-black/30">:</span>
            <ScoreInput label="Pen. gos." value={penAway} onChange={(value) => { touchForm(); setPenAway(value); }} />
          </div>
        )}

        {status === 'finished' && (
          <div className="mb-4">
            <div className="font-cond text-xs uppercase tracking-widest text-black/40 mb-2 text-center">Pobjednik</div>
            {resolvedWinnerId ? (
              <div className="text-center text-sm text-black/55">
                Automatski: <strong>{resolvedWinnerId === homeId ? home?.code ?? 'Domaći' : away?.code ?? 'Gosti'}</strong>
              </div>
            ) : (
              <>
                <div className="text-center text-sm text-black/50 mb-2">Neriješeno je. Ručno odaberi prolaznika.</div>
                <TeamToggle
                  value={winnerId}
                  onChange={(value) => { touchForm(); setWinnerId(value); }}
                  options={[
                    { id: homeId, label: home?.code ?? 'Domaći', tone: 'home' },
                    { id: awayId, label: away?.code ?? 'Gosti', tone: 'away' },
                  ]}
                />
              </>
            )}
          </div>
        )}

        <div className="mb-4">
          <div className="font-cond text-xs uppercase tracking-widest text-black/40 mb-1">Komentar utakmice</div>
          <textarea
            value={commentary}
            onChange={(e) => { touchForm(); setCommentary(e.target.value); }}
            rows={3}
            placeholder="Kratki osvrt, vidljiv na javnoj stranici utakmice."
            className="input resize-y"
          />
        </div>

        <div className="mb-4">
          <div className="font-cond text-xs uppercase tracking-widest text-black/40 mb-1">MVP (igrač utakmice)</div>
          <PlayerNameInput
            listId={`mvp-${match.id}`}
            players={allPlayers}
            value={mvpName}
            onChange={handleMvpNameChange}
            placeholder="Počni tipkati ime ili odaberi s popisa"
          />
          {mvpName.trim() && (
            <div className="mt-2">
              <TeamToggle
                value={effectiveMvpTeamId}
                onChange={(value) => { touchForm(); setMvpTeamId(value); }}
                options={[
                  { id: homeId, label: home?.code ?? 'Domaći', tone: 'home' },
                  { id: awayId, label: away?.code ?? 'Gosti', tone: 'away' },
                ]}
              />
            </div>
          )}
        </div>

        {err && <div className="text-brand-red text-sm mb-3">{err}</div>}

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
      <GoalAdder matchId={id!} homeId={homeId} awayId={awayId} home={home} away={away} />
      <div className="mt-3 space-y-2 mb-6">
        {goals.map((goal) => (
          <GoalRow
            key={goal.id}
            matchId={id!}
            goal={goal}
            home={home}
            away={away}
            homeId={homeId}
            awayId={awayId}
          />
        ))}
        {goals.length === 0 && <div className="text-sm text-black/40 text-center py-3">Još nema golova.</div>}
      </div>

      <h2 className="font-cond font-extrabold text-xs tracking-widest uppercase text-black/45 mb-3">Kartoni</h2>
      <CardAdder matchId={id!} homeId={homeId} awayId={awayId} home={home} away={away} />
      <div className="mt-3 space-y-2">
        {cards.map((card) => (
          <div key={card.id} className="card flex items-center gap-3 px-4 py-2.5">
            <span className={classNames(
              'w-5 h-6 rounded-sm shrink-0',
              card.color === 'yellow' ? 'bg-yellow-400' : 'bg-brand-red'
            )} />
            <span className="font-cond text-xs font-bold text-black/40 w-14">{card.minute}' {card.half}</span>
            <span className="flex-1 font-medium">{card.playerName}</span>
            <span className={classNames('pill', card.teamId === homeId ? 'bg-brand-blue/10 text-brand-blue' : 'bg-brand-red/10 text-brand-red')}>
              {card.teamId === homeId ? home?.code : away?.code}
            </span>
            <button
              onClick={() => {
                if (confirm('Obrisati karton?')) deleteDoc(doc(db, 'matches', id!, 'cards', card.id));
              }}
              className="text-black/30 hover:text-brand-red text-xs"
            >
              ×
            </button>
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
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="w-7 h-7 grid place-items-center text-lg">−</button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
          className="font-display text-3xl bg-transparent text-center w-12 outline-none"
        />
        <button type="button" onClick={() => onChange(value + 1)} className="w-7 h-7 grid place-items-center text-lg">+</button>
      </div>
    </div>
  );
}

function TeamToggle({
  value,
  onChange,
  options,
}: {
  value: string | null;
  onChange: (value: string) => void;
  options: { id: string; label: string; tone: 'home' | 'away' }[];
}) {
  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={classNames(
            'pill flex-1 justify-center',
            value === option.id
              ? option.tone === 'home' ? 'bg-brand-blue text-white' : 'bg-brand-red text-white'
              : 'bg-black/5 text-black/55'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function HalfToggle({ value, onChange }: { value: Half; onChange: (value: Half) => void }) {
  return (
    <>
      <button type="button" onClick={() => onChange('I')} className={classNames('pill', value === 'I' ? 'bg-brand-dark text-white' : 'bg-black/5 text-black/55')}>I. pol.</button>
      <button type="button" onClick={() => onChange('II')} className={classNames('pill', value === 'II' ? 'bg-brand-dark text-white' : 'bg-black/5 text-black/55')}>II. pol.</button>
    </>
  );
}

function PlayerNameInput({
  listId,
  players,
  value,
  onChange,
  placeholder,
}: {
  listId: string;
  players: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <>
      <input
        className="input"
        list={listId}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id={listId}>
        {players.map((player) => <option key={player} value={player} />)}
      </datalist>
    </>
  );
}

function GoalRow({
  matchId,
  goal,
  home,
  away,
  homeId,
  awayId,
}: {
  matchId: string;
  goal: Goal;
  home: SideTeam;
  away: SideTeam;
  homeId: string;
  awayId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [player, setPlayer] = useState(goal.playerName);
  const [teamId, setTeamId] = useState(goal.teamId);
  const [minute, setMinute] = useState(goal.minute);
  const [half, setHalf] = useState<Half>(goal.half);
  const playerOptions = teamId === homeId ? playerNames(home) : playerNames(away);

  async function saveRow() {
    await updateDoc(doc(db, 'matches', matchId, 'goals', goal.id), {
      playerName: player.trim(),
      teamId,
      minute,
      half,
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
        <button
          onClick={() => {
            if (confirm('Obrisati gol?')) deleteDoc(doc(db, 'matches', matchId, 'goals', goal.id));
          }}
          className="text-black/30 hover:text-brand-red text-xs"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="card p-3 space-y-2">
      <TeamToggle
        value={teamId}
        onChange={setTeamId}
        options={[
          { id: homeId, label: home?.code ?? 'Domaći', tone: 'home' },
          { id: awayId, label: away?.code ?? 'Gosti', tone: 'away' },
        ]}
      />
      <PlayerNameInput
        listId={`goal-row-${goal.id}`}
        players={playerOptions}
        value={player}
        onChange={setPlayer}
        placeholder="Ime strijelca"
      />
      <div className="flex gap-2">
        <input type="number" min={1} max={40} className="input" value={minute} onChange={(e) => setMinute(parseInt(e.target.value, 10) || 1)} />
        <HalfToggle value={half} onChange={setHalf} />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => setEditing(false)} className="btn-ghost flex-1">Odustani</button>
        <button type="button" onClick={saveRow} className="btn-primary flex-1">Spremi</button>
      </div>
    </div>
  );
}

function GoalAdder({ matchId, homeId, awayId, home, away }: {
  matchId: string;
  homeId: string;
  awayId: string;
  home: SideTeam;
  away: SideTeam;
}) {
  const [player, setPlayer] = useState('');
  const [teamId, setTeamId] = useState(homeId);
  const [minute, setMinute] = useState(1);
  const [half, setHalf] = useState<Half>('I');
  const [busy, setBusy] = useState(false);
  const playerOptions = teamId === homeId ? playerNames(home) : playerNames(away);

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
      <TeamToggle
        value={teamId}
        onChange={setTeamId}
        options={[
          { id: homeId, label: home?.code ?? 'Domaći', tone: 'home' },
          { id: awayId, label: away?.code ?? 'Gosti', tone: 'away' },
        ]}
      />
      <PlayerNameInput
        listId={`goal-add-${matchId}`}
        players={playerOptions}
        value={player}
        onChange={setPlayer}
        placeholder="Ime strijelca"
      />
      <div className="flex gap-2">
        <input type="number" min={1} max={40} className="input" placeholder="Minuta" value={minute} onChange={(e) => setMinute(parseInt(e.target.value, 10) || 1)} />
        <HalfToggle value={half} onChange={setHalf} />
      </div>
      <button className="btn-primary w-full" disabled={busy || !player.trim()}>Dodaj gol</button>
    </form>
  );
}

function CardAdder({ matchId, homeId, awayId, home, away }: {
  matchId: string;
  homeId: string;
  awayId: string;
  home: SideTeam;
  away: SideTeam;
}) {
  const [player, setPlayer] = useState('');
  const [teamId, setTeamId] = useState(homeId);
  const [minute, setMinute] = useState(1);
  const [half, setHalf] = useState<Half>('I');
  const [color, setColor] = useState<CardColor>('yellow');
  const [busy, setBusy] = useState(false);
  const playerOptions = teamId === homeId ? playerNames(home) : playerNames(away);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!player.trim()) return;
    setBusy(true);
    await addDoc(collection(db, 'matches', matchId, 'cards'), {
      playerName: player.trim(),
      teamId,
      minute,
      half,
      color,
      createdAt: Date.now(),
    });
    setPlayer('');
    setBusy(false);
  }

  return (
    <form onSubmit={add} className="card p-4 space-y-3">
      <TeamToggle
        value={teamId}
        onChange={setTeamId}
        options={[
          { id: homeId, label: home?.code ?? 'Domaći', tone: 'home' },
          { id: awayId, label: away?.code ?? 'Gosti', tone: 'away' },
        ]}
      />
      <PlayerNameInput
        listId={`card-add-${matchId}`}
        players={playerOptions}
        value={player}
        onChange={setPlayer}
        placeholder="Ime igrača"
      />
      <div className="flex gap-2">
        <button type="button" onClick={() => setColor('yellow')} className={classNames('flex-1 pill', color === 'yellow' ? 'bg-yellow-400 text-black' : 'bg-black/5 text-black/55')}>Žuti</button>
        <button type="button" onClick={() => setColor('red')} className={classNames('flex-1 pill', color === 'red' ? 'bg-brand-red text-white' : 'bg-black/5 text-black/55')}>Crveni</button>
      </div>
      <div className="flex gap-2">
        <input type="number" min={1} max={40} className="input" placeholder="Minuta" value={minute} onChange={(e) => setMinute(parseInt(e.target.value, 10) || 1)} />
        <HalfToggle value={half} onChange={setHalf} />
      </div>
      <button className="btn-primary w-full" disabled={busy || !player.trim()}>Dodaj karton</button>
    </form>
  );
}

function MatchClockCard({ matchId, match }: { matchId: string; match: Match }) {
  const { displayTime, phase, phaseLabel, running } = useMatchClock(match);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function apply(patch: Record<string, unknown>, confirmMessage?: string) {
    if (confirmMessage && !confirm(confirmMessage)) return;
    setBusy(true);
    setErr(null);
    try {
      await updateDoc(doc(db, 'matches', matchId), {
        ...patch,
        updatedAt: serverTimestamp(),
      });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Ažuriranje nije uspjelo.');
    } finally {
      setBusy(false);
    }
  }

  // Read Date.now() and the current clock inside each handler so pause/resume
  // use the click-time timestamp, not a stale one captured at render time.
  // (While paused, the component stops re-rendering, so a render-time `now`
  //  would lose the entire pause duration on resume.)
  const onStartH1 = () =>
    apply({ clock: startFirstHalf(Date.now()), status: 'live' as MatchStatus });
  const onPause = () => apply({ clock: pauseClock(getClock(match), Date.now()) });
  const onResume = () => apply({ clock: resumeClock(getClock(match), Date.now()) });
  const onEndH1 = () => apply({ clock: endFirstHalf(Date.now()) });
  const onStartH2 = () => apply({ clock: startSecondHalf(Date.now()) });
  const onEndMatch = () =>
    apply(
      { clock: endMatchClock(getClock(match), Date.now()), status: 'finished' as MatchStatus },
      'Završiti utakmicu?',
    );
  const onReset = () =>
    apply(
      { clock: resetClock(), status: 'scheduled' as MatchStatus },
      'Poništiti sat i vratiti na "Planirano"?',
    );

  const accent =
    phase === 'pre' || phase === 'FT'
      ? 'text-black/50'
      : phase === 'HT'
        ? 'text-brand-blue'
        : 'text-brand-red';

  return (
    <div className="card p-5 mb-5">
      <div className="font-cond text-xs uppercase tracking-widest text-black/40 mb-2 text-center">
        Vrijeme utakmice
      </div>
      <div className="flex items-center justify-center gap-3 mb-1">
        {running && phase !== 'HT' && (
          <span className="relative inline-flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full bg-brand-red animate-livePulse" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-brand-red" />
          </span>
        )}
        <div className={classNames('font-display text-5xl tracking-wide tabular-nums', accent)}>
          {displayTime}
        </div>
      </div>
      <div className="text-center font-cond text-xs uppercase tracking-widest text-black/55 mb-4">
        {phaseLabel}
        {!running && phase !== 'pre' && phase !== 'FT' ? ' · pauza' : ''}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {phase === 'pre' && (
          <button onClick={onStartH1} disabled={busy} className="btn-primary col-span-2">
            Pokreni 1. poluvrijeme
          </button>
        )}

        {phase === 'H1' && running && (
          <>
            <button onClick={onPause} disabled={busy} className="btn-ghost">Pauza</button>
            <button onClick={onEndH1} disabled={busy} className="btn-primary">
              Kraj 1. poluvrijeme
            </button>
          </>
        )}
        {phase === 'H1' && !running && (
          <>
            <button onClick={onResume} disabled={busy} className="btn-primary">Nastavi</button>
            <button onClick={onEndH1} disabled={busy} className="btn-ghost">
              Kraj 1. poluvrijeme
            </button>
          </>
        )}

        {phase === 'HT' && (
          <button onClick={onStartH2} disabled={busy} className="btn-primary col-span-2">
            Pokreni 2. poluvrijeme
          </button>
        )}

        {phase === 'H2' && running && (
          <>
            <button onClick={onPause} disabled={busy} className="btn-ghost">Pauza</button>
            <button onClick={onEndMatch} disabled={busy} className="btn-red">
              Završi utakmicu
            </button>
          </>
        )}
        {phase === 'H2' && !running && (
          <>
            <button onClick={onResume} disabled={busy} className="btn-primary">Nastavi</button>
            <button onClick={onEndMatch} disabled={busy} className="btn-red">
              Završi utakmicu
            </button>
          </>
        )}

        {phase === 'FT' && (
          <div className="col-span-2 text-center text-sm text-black/45 py-2">
            Sat zaustavljen.
          </div>
        )}

        {phase !== 'pre' && (
          <button onClick={onReset} disabled={busy} className="btn-ghost col-span-2 text-black/45">
            Resetiraj sat
          </button>
        )}
      </div>

      {err && <div className="text-brand-red text-sm mt-3 text-center">{err}</div>}
    </div>
  );
}

function playerNames(team: SideTeam): string[] {
  return (team?.players ?? []).map((player) => player.name);
}

function inferTeamIdForPlayer(
  name: string,
  homeId: string,
  awayId: string,
  home: SideTeam,
  away: SideTeam,
): string {
  const normalized = name.trim().toLocaleLowerCase('hr');
  if (!normalized) return '';
  if (playerNames(home).some((player) => player.toLocaleLowerCase('hr') === normalized)) return homeId;
  if (playerNames(away).some((player) => player.toLocaleLowerCase('hr') === normalized)) return awayId;
  return '';
}

function resolveWinner({
  status,
  homeScore,
  awayScore,
  penaltiesOn,
  penHome,
  penAway,
  homeId,
  awayId,
  manualWinnerId,
}: {
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  penaltiesOn: boolean;
  penHome: number;
  penAway: number;
  homeId: string;
  awayId: string;
  manualWinnerId: string | null;
}): string | null {
  if (status !== 'finished') return null;
  if (homeScore > awayScore) return homeId;
  if (awayScore > homeScore) return awayId;
  if (penaltiesOn) {
    if (penHome > penAway) return homeId;
    if (penAway > penHome) return awayId;
  }
  return manualWinnerId;
}
