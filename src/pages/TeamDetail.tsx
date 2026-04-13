import { Link, useParams } from 'react-router-dom';
import { useMatches, useTeam, useTeams } from '../lib/hooks';
import MatchCard from '../components/MatchCard';
import Loading from '../components/Loading';

export default function TeamDetail() {
  const { id } = useParams();
  const team = useTeam(id);
  const allMatches = useMatches();
  const allTeams = useTeams();

  if (team === undefined || allMatches === null || allTeams === null) return <Loading />;
  if (team === null) return <div className="text-center py-10">Ekipa nije pronađena.</div>;

  const teamMap = new Map(allTeams.map((t) => [t.id, t]));
  const matches = allMatches.filter((m) => m.homeId === id || m.awayId === id);
  const played = matches.filter((m) => m.status === 'finished');
  const upcoming = matches.filter((m) => m.status !== 'finished');

  const wins = played.filter((m) => m.winnerId === id).length;
  const losses = played.length - wins;

  return (
    <div>
      <Link to="/ekipe" className="font-cond text-xs tracking-widest uppercase text-black/40 mb-3 inline-block">
        ← Sve ekipe
      </Link>

      <div className="card p-6 mb-5">
        <div className="font-cond text-xs tracking-widest uppercase text-black/40">{team.division}</div>
        <div className="flex items-end justify-between">
          <div>
            <div className="font-display text-5xl">{team.code}</div>
            <div className="text-sm text-black/50 mt-1">Kapetan: {team.captain}</div>
          </div>
          <div className="text-right">
            <div className="font-cond text-xs tracking-widest uppercase text-black/40">Bilanca</div>
            <div className="font-display text-3xl">{wins} : {losses}</div>
          </div>
        </div>
      </div>

      <h2 className="font-cond font-extrabold text-xs tracking-widest uppercase text-black/45 mb-3">Igrači</h2>
      <div className="card p-4 mb-7">
        <ul className="divide-y divide-black/5">
          {team.players.map((p, i) => (
            <li key={i} className="py-2 flex items-center justify-between">
              <span className="font-medium">{p.name}</span>
              {p.is_captain && <span className="pill bg-brand-blue/10 text-brand-blue">Kapetan</span>}
            </li>
          ))}
        </ul>
      </div>

      {upcoming.length > 0 && (
        <>
          <h2 className="font-cond font-extrabold text-xs tracking-widest uppercase text-black/45 mb-3">Predstojeće</h2>
          {upcoming.map((m, i) => (
            <MatchCard key={m.id} match={m} home={teamMap.get(m.homeId)} away={teamMap.get(m.awayId)} index={i} compact />
          ))}
        </>
      )}

      {played.length > 0 && (
        <>
          <h2 className="font-cond font-extrabold text-xs tracking-widest uppercase text-black/45 mb-3 mt-4">Odigrane</h2>
          {played.map((m, i) => (
            <MatchCard key={m.id} match={m} home={teamMap.get(m.homeId)} away={teamMap.get(m.awayId)} index={i} compact />
          ))}
        </>
      )}
    </div>
  );
}
