import { useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import Loading from '../../components/Loading';
import { db } from '../../lib/firebase';
import { useMatches, useTeams } from '../../lib/hooks';
import type { Match, Stage } from '../../lib/types';
import { classNames, compareMatchSchedule, STAGE_LABEL, todayIso } from '../../lib/utils';

const STAGE_OPTIONS: { value: Exclude<Stage, 'R1'>; label: string; placeholder: string }[] = [
  { value: 'WB', label: 'Pobjednička', placeholder: 'npr. WB-SF1' },
  { value: 'LB', label: 'Poražena', placeholder: 'npr. LB-R2' },
  { value: 'F', label: 'Finale', placeholder: 'npr. F1' },
];

export default function BracketAdmin() {
  const teams = useTeams();
  const matches = useMatches();

  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState('14:25');
  const [stage, setStage] = useState<Exclude<Stage, 'R1'>>('WB');
  const [bracketSlot, setBracketSlot] = useState('');
  const [homeId, setHomeId] = useState('');
  const [awayId, setAwayId] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const stage2Matches = useMemo(() => (
    (matches ?? [])
      .filter((match) => match.stage !== 'R1')
      .sort(compareMatchSchedule)
  ), [matches]);

  if (teams === null || matches === null) return <Loading />;

  async function createMatch(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!homeId || !awayId || !date) return;
    if (homeId === awayId) {
      setErr('Domaća i gostujuća ekipa moraju biti različite.');
      return;
    }

    setBusy(true);
    try {
      await addDoc(collection(db, 'matches'), {
        stage,
        bracketSlot: bracketSlot.trim() || null,
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
      setHomeId('');
      setAwayId('');
      setBracketSlot('');
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Spremanje nije uspjelo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-2 tracking-wide">Ladder - admin</h1>
      <p className="text-sm text-black/55 mb-5">
        Druga faza se sada vodi direktno iz utakmica. Dodaj meč u odgovarajuću granu i po potrebi mu upiši oznaku kruga.
      </p>

      <form onSubmit={createMatch} className="card p-4 space-y-3 mb-6">
        <h2 className="font-cond font-extrabold text-xs uppercase tracking-widest text-black/50">Nova utakmica</h2>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
          <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} required />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStage(option.value)}
              className={classNames('pill', stage === option.value ? 'bg-brand-dark text-white' : 'bg-black/5 text-black/55')}
            >
              {option.label}
            </button>
          ))}
        </div>
        <input
          className="input"
          placeholder={STAGE_OPTIONS.find((option) => option.value === stage)?.placeholder}
          value={bracketSlot}
          onChange={(e) => setBracketSlot(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <select className="input" value={homeId} onChange={(e) => setHomeId(e.target.value)} required>
            <option value="">Domaći</option>
            {teams.map((team) => <option key={team.id} value={team.id}>{team.code}</option>)}
          </select>
          <select className="input" value={awayId} onChange={(e) => setAwayId(e.target.value)} required>
            <option value="">Gosti</option>
            {teams.map((team) => <option key={team.id} value={team.id}>{team.code}</option>)}
          </select>
        </div>
        {err && <div className="text-brand-red text-sm">{err}</div>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Spremanje...' : 'Dodaj utakmicu'}</button>
      </form>

      <h2 className="font-cond font-extrabold text-xs uppercase tracking-widest text-black/50 mb-3">Postojeće II. faze</h2>
      {stage2Matches.length === 0 ? (
        <div className="card p-6 text-center text-black/50">Još nema utakmica druge faze.</div>
      ) : (
        <div className="space-y-6">
          {STAGE_OPTIONS.map((option) => {
            const list = stage2Matches.filter((match) => match.stage === option.value);
            return (
              <div key={option.value}>
                <div className="font-cond text-xs tracking-widest uppercase text-black/40 mb-2">{option.label}</div>
                {list.length === 0 ? (
                  <div className="card p-4 text-sm text-black/45 text-center">Nema utakmica u ovoj grani.</div>
                ) : (
                  <div className="space-y-2">
                    {list.map((match) => (
                      <MatchRow key={match.id} match={match} teams={teams} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MatchRow({ match, teams }: { match: Match; teams: NonNullable<ReturnType<typeof useTeams>> }) {
  const home = teams.find((team) => team.id === match.homeId);
  const away = teams.find((team) => team.id === match.awayId);

  return (
    <div className="card flex items-center gap-3 px-4 py-3">
      <span className="pill bg-brand-blue/10 text-brand-blue">
        {STAGE_LABEL[match.stage]}{match.bracketSlot ? ` · ${match.bracketSlot}` : ''}
      </span>
      <span className="text-xs text-black/40 font-cond">{match.date} {match.time}</span>
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="font-display text-lg truncate">{home?.code ?? '?'}</span>
        <span className="text-black/30">vs</span>
        <span className="font-display text-lg truncate">{away?.code ?? '?'}</span>
      </div>
      <Link to={`/admin/utakmica/${match.id}`} className="font-cond text-xs uppercase tracking-widest text-brand-blue">Uredi</Link>
      <button
        onClick={() => {
          if (confirm('Obrisati utakmicu?')) deleteDoc(doc(db, 'matches', match.id));
        }}
        className="text-black/30 hover:text-brand-red text-xs"
      >
        ×
      </button>
    </div>
  );
}
