import { Link, useParams } from 'react-router-dom';
import { useMatch, useGoals, useCards, useTeam, useTeams } from '../lib/hooks';
import MatchCard from '../components/MatchCard';
import Loading from '../components/Loading';
import { classNames, formatDateHr, STAGE_LABEL } from '../lib/utils';

export default function MatchDetail() {
  const { id } = useParams();
  const match = useMatch(id);
  const goals = useGoals(id);
  const cards = useCards(id);
  const home = useTeam(match?.homeId);
  const away = useTeam(match?.awayId);
  const teams = useTeams();

  if (match === undefined) return <Loading />;
  if (match === null) return <div className="card p-8 text-center text-black/45">Utakmica nije pronadena.</div>;
  const currentMatch = match;

  const mvpTeamCode = currentMatch.mvpTeamId === currentMatch.homeId ? home?.code
    : currentMatch.mvpTeamId === currentMatch.awayId ? away?.code : null;

  return (
    <div className="space-y-6">
      <Link to="/utakmice" className="font-cond text-xs tracking-[0.18em] uppercase text-black/40 inline-block">
        ← Sve utakmice
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <span className="pill">{STAGE_LABEL[currentMatch.stage]}</span>
        {currentMatch.matchNumber && <span className="pill">{currentMatch.matchNumber}</span>}
        <span className="text-xs text-black/40 font-cond uppercase tracking-[0.16em]">
          {formatDateHr(currentMatch.date)}
        </span>
      </div>

      <MatchCard
        match={currentMatch}
        home={home ?? undefined}
        away={away ?? undefined}
        goals={goals}
        linkable={false}
      />

      {currentMatch.mvpName && (
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-blue/10 text-brand-blue grid place-items-center font-display text-xl">★</div>
          <div className="flex-1 min-w-0">
            <div className="font-cond text-[10px] uppercase tracking-[0.16em] text-black/40">Igrac utakmice</div>
            <div className="font-bold truncate">{currentMatch.mvpName}</div>
            {mvpTeamCode && <div className="text-xs text-black/50 font-cond uppercase tracking-[0.16em]">{mvpTeamCode}</div>}
          </div>
        </div>
      )}

      {currentMatch.commentary && (
        <div className="card p-4">
          <div className="font-cond text-[10px] uppercase tracking-[0.16em] text-black/40 mb-2">Osvrt</div>
          <p className="whitespace-pre-wrap leading-relaxed">{currentMatch.commentary}</p>
        </div>
      )}

      {cards.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-cond font-extrabold text-xs tracking-[0.18em] uppercase text-black/45">Kartoni</h2>
          <div className="card divide-y divide-black/5">
            {cards.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className={classNames('w-4 h-5 rounded-sm shrink-0', c.color === 'yellow' ? 'bg-yellow-400' : 'bg-brand-red')} />
                <span className="font-cond text-xs font-bold text-black/40 w-14">{c.minute}' {c.half}</span>
                <span className="flex-1 font-medium">{c.playerName}</span>
                <span className={classNames(
                  'pill',
                  c.teamId === currentMatch.homeId ? 'border-brand-blue/10 bg-brand-blue/10 text-brand-blue' : 'border-brand-red/10 bg-brand-red/10 text-brand-red'
                )}>
                  {c.teamId === currentMatch.homeId ? home?.code : away?.code}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {(home || away) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[home, away].map((t) =>
            t ? (
              <Link key={t.id} to={`/ekipe/${t.id}`} className="card p-4 hover:border-black/15 transition">
                <div className="font-cond text-xs tracking-[0.16em] uppercase text-black/40">Ekipa</div>
                <div className="font-display text-4xl leading-none mt-2" style={t.color ? { color: t.color } : undefined}>{t.code}</div>
                <div className="text-sm text-black/50 mt-2">{t.playersCount} igraca</div>
              </Link>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
