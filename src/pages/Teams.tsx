import { Link } from 'react-router-dom';
import { useTeams } from '../lib/hooks';
import Loading from '../components/Loading';

export default function Teams() {
  const teams = useTeams();
  if (teams === null) return <Loading />;

  const muski = teams.filter((t) => t.division === 'Muški');
  const zenske = teams.filter((t) => t.division === 'Ženski');

  return (
    <div>
      <h1 className="font-display text-4xl mb-5 tracking-wide">Ekipe</h1>

      {teams.length === 0 && <div className="text-black/40 text-center py-10">Još nema ekipa.</div>}

      <Group title="Muški" teams={muski} />
      {zenske.length > 0 && <Group title="Ženski" teams={zenske} />}
    </div>
  );
}

function Group({ title, teams }: { title: string; teams: { id: string; code: string; playersCount: number; captain: string }[] }) {
  if (teams.length === 0) return null;
  return (
    <div className="mb-7">
      <h2 className="font-cond font-extrabold text-xs tracking-widest uppercase text-black/45 mb-3">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {teams.map((t) => (
          <Link key={t.id} to={`/ekipe/${t.id}`} className="card p-4 hover:scale-[1.02] transition">
            <div className="font-display text-3xl leading-none">{t.code}</div>
            <div className="mt-2 text-[11px] font-cond tracking-widest uppercase text-black/40">
              {t.playersCount} igrača
            </div>
            <div className="text-xs text-black/55 mt-1 truncate">©  {t.captain}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
