import { Link } from 'react-router-dom';
import { deleteDoc, doc } from 'firebase/firestore';
import TeamEliminationBadge from '../../components/TeamEliminationBadge';
import Loading from '../../components/Loading';
import { db } from '../../lib/firebase';
import { useMatches, useTeams } from '../../lib/hooks';
import { getTeamEliminationState } from '../../lib/teamElimination';

export default function TeamsAdmin() {
  const teams = useTeams();
  const matches = useMatches();
  if (teams === null || matches === null) return <Loading />;

  async function remove(id: string, code: string) {
    if (!confirm(`Obrisati ekipu ${code}? Ovo se ne može poništiti.`)) return;
    await deleteDoc(doc(db, 'teams', id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-3xl tracking-wide">Ekipe</h1>
        <Link to="/admin/ekipe/nova" className="btn-primary">+ Nova</Link>
      </div>

      {teams.length === 0 && (
        <div className="card p-6 text-center text-black/50">Nema ekipa. Dodaj prvu klikom na <strong>+ Nova</strong>.</div>
      )}

      <div className="space-y-2">
        {teams.map((t) => (
          <div key={t.id} className="card flex items-center gap-3 px-4 py-3">
            <div className="font-display text-2xl w-16">{t.code}</div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{t.captain}</div>
              <div className="text-xs text-black/45 font-cond uppercase tracking-wider">
                {t.division} · {t.playersCount} igrača
              </div>
            </div>
            <TeamEliminationBadge
              state={getTeamEliminationState(t.id, matches, t.eliminationOverride)}
              teamCode={t.code}
              showManualNote
            />
            <Link to={`/admin/ekipe/${t.id}`} className="font-cond text-xs uppercase tracking-widest text-brand-blue">Uredi</Link>
            <button onClick={() => remove(t.id, t.code)} className="text-black/30 hover:text-brand-red text-xl leading-none">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
