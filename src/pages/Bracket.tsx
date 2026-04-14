import { useMatches, useTeams, useBracketStage2 } from '../lib/hooks';
import { Link } from 'react-router-dom';
import { SkeletonList } from '../components/Skeleton';
import TeamCrest from '../components/TeamCrest';
import { classNames } from '../lib/utils';
import type { Team } from '../lib/types';

const BLUE = '#1d4e9e';
const RED = '#d42a3c';

export default function Bracket() {
  const matches = useMatches();
  const teams = useTeams();
  const stage2 = useBracketStage2();

  if (matches === null || teams === null) {
    return (
      <div>
        <h1 className="font-display text-4xl mb-5 tracking-wide">Ladder</h1>
        <SkeletonList count={4} />
      </div>
    );
  }
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const stage1 = matches.filter((m) => m.stage === 'R1');

  return (
    <div>
      <h1 className="font-display text-4xl mb-2 tracking-wide">Ladder</h1>
      <p className="text-sm text-black/50 mb-6">Pregled napretka kroz turnir.</p>

      <Section title="I. kolo (eliminacija)">
        <div className="space-y-2">
          {stage1.map((m) => {
            const home = teamMap.get(m.homeId);
            const away = teamMap.get(m.awayId);
            const winnerHome = m.winnerId === m.homeId;
            const winnerAway = m.winnerId === m.awayId;
            const homeColor = home?.color || BLUE;
            const awayColor = away?.color || RED;
            return (
              <Link
                key={m.id}
                to={`/utakmice/${m.id}`}
                className="card flex items-stretch overflow-hidden hover:scale-[1.01] transition"
                style={{
                  background: m.winnerId
                    ? `linear-gradient(90deg, ${winnerHome ? homeColor : awayColor}0d 0%, transparent 60%)`
                    : undefined,
                }}
              >
                <div className="bg-brand-dark text-white font-cond font-bold text-xs px-3 grid place-items-center min-w-[40px] tracking-wider">
                  {m.id.slice(-2)}
                </div>
                <div className="flex-1 flex">
                  <Side team={home} code={home?.code ?? '?'} winner={winnerHome} side="home" color={homeColor} finished={m.status === 'finished'} />
                  <div className="grid place-items-center px-3 font-display text-xl text-black/40">
                    {m.status === 'finished' || m.status === 'live' ? `${m.homeScore}:${m.awayScore}` : 'vs'}
                  </div>
                  <Side team={away} code={away?.code ?? '?'} winner={winnerAway} side="away" color={awayColor} finished={m.status === 'finished'} />
                </div>
              </Link>
            );
          })}
        </div>
      </Section>

      <Section title="II. faza — Double Elimination">
        {stage2 === undefined && <SkeletonList count={3} />}
        {stage2 === null && (
          <div className="card p-6 text-center text-black/50">
            Druga faza nije još kreirana. Admin može dodati utakmice nakon završetka I. kola.
          </div>
        )}
        {stage2 && (
          <div className="space-y-6">
            <BracketColumn title="Pobjednička ekipa (WB)" slots={stage2.winnersBracket} teamMap={teamMap} matches={matches} />
            <BracketColumn title="Poražena ekipa (LB)" slots={stage2.losersBracket} teamMap={teamMap} matches={matches} />
            <BracketColumn title="Finale" slots={[stage2.final]} teamMap={teamMap} matches={matches} />
            <BracketColumn title="Veliko finale" slots={[stage2.grandFinal]} teamMap={teamMap} matches={matches} />
          </div>
        )}
      </Section>
    </div>
  );
}

function Side({ team, code, winner, side, color, finished }: { team?: Team | null; code: string; winner: boolean; side: 'home' | 'away'; color: string; finished: boolean }) {
  return (
    <div
      className={classNames(
        'flex-1 px-3 py-3 font-display text-2xl flex items-center gap-2 min-w-0',
        side === 'home' ? 'justify-end' : 'justify-start'
      )}
      style={{
        color: winner ? color : finished ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.7)',
      }}
    >
      {side === 'away' && <TeamCrest team={team} size={22} />}
      <span className="truncate">{code}</span>
      {side === 'home' && <TeamCrest team={team} size={22} />}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="font-cond font-extrabold text-xs tracking-widest uppercase text-black/50 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function BracketColumn({ title, slots, teamMap, matches }: { title: string; slots: any[]; teamMap: Map<string, Team>; matches: any[] }) {
  return (
    <div>
      <div className="font-cond text-xs tracking-widest uppercase text-black/40 mb-2">{title}</div>
      <div className="space-y-2">
        {slots.map((slot: any) => {
          const m = slot.matchId ? matches.find((x: any) => x.id === slot.matchId) : null;
          const home = m ? teamMap.get(m.homeId) : null;
          const away = m ? teamMap.get(m.awayId) : null;
          const winnerHome = m && m.winnerId === m?.homeId;
          const winnerAway = m && m.winnerId === m?.awayId;
          const homeColor = home?.color || BLUE;
          const awayColor = away?.color || RED;
          return (
            <div
              key={slot.id}
              className="card p-3"
              style={m?.winnerId ? {
                background: `linear-gradient(90deg, ${winnerHome ? homeColor : awayColor}0d 0%, transparent 70%)`,
              } : undefined}
            >
              <div className="font-cond text-[10px] tracking-widest uppercase text-black/30">{slot.label}</div>
              {m ? (
                <Link to={`/utakmice/${m.id}`} className="flex items-center justify-between mt-1 gap-2">
                  <span className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                    <span
                      className="font-display text-xl truncate"
                      style={{ color: winnerHome ? homeColor : 'inherit' }}
                    >{home?.code ?? '?'}</span>
                    <TeamCrest team={home} size={20} />
                  </span>
                  <span className="font-display text-base text-black/40 shrink-0">
                    {m.status !== 'scheduled' ? `${m.homeScore} : ${m.awayScore}` : 'vs'}
                  </span>
                  <span className="flex items-center gap-1.5 min-w-0 flex-1">
                    <TeamCrest team={away} size={20} />
                    <span
                      className="font-display text-xl truncate"
                      style={{ color: winnerAway ? awayColor : 'inherit' }}
                    >{away?.code ?? '?'}</span>
                  </span>
                </Link>
              ) : (
                <div className="text-sm text-black/40 mt-1">još nije zakazano</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
