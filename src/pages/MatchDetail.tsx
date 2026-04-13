import { Link, useParams } from 'react-router-dom';
import { useMatch, useGoals, useTeam } from '../lib/hooks';
import MatchCard from '../components/MatchCard';
import Loading from '../components/Loading';
import { formatDateHr, STAGE_LABEL } from '../lib/utils';

export default function MatchDetail() {
  const { id } = useParams();
  const match = useMatch(id);
  const goals = useGoals(id);
  const home = useTeam(match?.homeId);
  const away = useTeam(match?.awayId);

  if (match === undefined) return <Loading />;
  if (match === null) return <div className="text-center py-10">Utakmica nije pronađena.</div>;

  return (
    <div>
      <Link to="/utakmice" className="font-cond text-xs tracking-widest uppercase text-black/40 mb-3 inline-block">
        ← Sve utakmice
      </Link>

      <div className="mb-3 flex items-center gap-2">
        <span className="pill bg-brand-blue/10 text-brand-blue">{STAGE_LABEL[match.stage]}</span>
        <span className="text-xs text-black/40 font-cond uppercase tracking-wider">
          {formatDateHr(match.date)} · {match.time}
        </span>
      </div>

      <MatchCard
        match={match}
        home={home ?? undefined}
        away={away ?? undefined}
        goals={goals}
        linkable={false}
      />

      {(home || away) && (
        <div className="grid grid-cols-2 gap-3 mt-5">
          {[home, away].map((t) =>
            t ? (
              <Link key={t.id} to={`/ekipe/${t.id}`} className="card p-4">
                <div className="font-cond text-xs tracking-widest uppercase text-black/40">Ekipa</div>
                <div className="font-display text-2xl">{t.code}</div>
                <div className="text-xs text-black/50 mt-1">{t.playersCount} igrača</div>
              </Link>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
