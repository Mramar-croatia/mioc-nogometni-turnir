import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMatches, useTeams } from '../lib/hooks';
import { useFollowedTeams } from '../lib/favorites';
import { buildIcs, downloadIcs } from '../lib/ics';
import { SkeletonTeamGrid } from '../components/Skeleton';
import TeamCrest from '../components/TeamCrest';
import { classNames } from '../lib/utils';
import type { Team } from '../lib/types';

export default function Teams() {
  const teams = useTeams();
  const matches = useMatches();
  const [search, setSearch] = useState('');
  const { isFollowed, toggle } = useFollowedTeams();

  const filteredTeams = useMemo(() => {
    if (!teams) return [];
    if (!search.trim()) return teams;
    const q = search.toLowerCase();
    return teams.filter((t) =>
      t.code.toLowerCase().includes(q) ||
      t.displayName?.toLowerCase().includes(q) ||
      t.captain?.toLowerCase().includes(q) ||
      t.players?.some((p) => p.name.toLowerCase().includes(q))
    );
  }, [teams, search]);

  if (teams === null) {
    return (
      <div>
        <h1 className="font-display text-4xl mb-5 tracking-wide">Ekipe</h1>
        <SkeletonTeamGrid count={9} />
      </div>
    );
  }

  const muski = filteredTeams.filter((t) => t.division === 'Muški');
  const zenske = filteredTeams.filter((t) => t.division === 'Ženski');

  function exportAll() {
    if (!matches || !teams) return;
    const map = new Map(teams.map((t) => [t.id, t]));
    downloadIcs(
      'mioc-turnir-raspored.ics',
      buildIcs(matches, map, 'MIOC Turnir — raspored')
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="font-display text-4xl tracking-wide">Ekipe</h1>
        {matches && matches.length > 0 && (
          <button onClick={exportAll} className="btn-ghost" title="Cijeli raspored u kalendar">
            + Kalendar
          </button>
        )}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Pretraži ekipu, kapetana ili igrača..."
        className="input mb-5"
      />

      {filteredTeams.length === 0 && (
        <div className="text-black/40 text-center py-10">Ništa nije pronađeno.</div>
      )}

      <Group title="Muški" teams={muski} isFollowed={isFollowed} toggle={toggle} />
      {zenske.length > 0 && <Group title="Ženski" teams={zenske} isFollowed={isFollowed} toggle={toggle} />}
    </div>
  );
}

function Group({ title, teams, isFollowed, toggle }: {
  title: string;
  teams: Team[];
  isFollowed: (id: string) => boolean;
  toggle: (id: string) => void;
}) {
  if (teams.length === 0) return null;
  // Followed first, then alphabetical.
  const sorted = [...teams].sort((a, b) => {
    const fa = isFollowed(a.id) ? 0 : 1;
    const fb = isFollowed(b.id) ? 0 : 1;
    return fa - fb || a.code.localeCompare(b.code, 'hr');
  });
  return (
    <div className="mb-7">
      <h2 className="font-cond font-extrabold text-xs tracking-widest uppercase text-black/45 mb-3">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sorted.map((t) => {
          const followed = isFollowed(t.id);
          return (
            <div
              key={t.id}
              className="card relative hover:scale-[1.02] transition overflow-hidden"
              style={t.color ? { boxShadow: `0 2px 8px ${t.color}15, 0 8px 32px ${t.color}15` } : undefined}
            >
              {t.color && (
                <div className="h-1" style={{ background: t.color }} />
              )}
              <button
                onClick={(e) => { e.preventDefault(); toggle(t.id); }}
                className={classNames(
                  'absolute top-2 right-2 w-8 h-8 grid place-items-center rounded-full text-lg transition z-10',
                  followed ? 'text-brand-blue' : 'text-black/20 hover:text-black/50'
                )}
                aria-label={followed ? 'Prestani pratiti' : 'Prati ekipu'}
                title={followed ? 'Pratiš' : 'Prati ekipu'}
              >
                {followed ? '★' : '☆'}
              </button>
              <Link to={`/ekipe/${t.id}`} className="block p-4">
                <div className="flex items-center gap-3 pr-7">
                  <TeamCrest team={t} size={44} rounded="lg" />
                  <div
                    className="font-display text-3xl leading-none min-w-0 truncate"
                    style={t.color ? { color: t.color } : undefined}
                  >
                    {t.code}
                  </div>
                </div>
                <div className="mt-2 text-[11px] font-cond tracking-widest uppercase text-black/40">
                  {t.playersCount} igrača
                </div>
                <div className="text-xs text-black/55 mt-1 truncate">©  {t.captain}</div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
