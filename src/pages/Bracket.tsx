import { useMatches, useTeams, useBracketStage2 } from '../lib/hooks';
import { Link } from 'react-router-dom';
import Loading from '../components/Loading';
import { classNames } from '../lib/utils';

export default function Bracket() {
  const matches = useMatches();
  const teams = useTeams();
  const stage2 = useBracketStage2();

  if (matches === null || teams === null) return <Loading />;
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
            return (
              <Link
                key={m.id}
                to={`/utakmice/${m.id}`}
                className="card flex items-stretch overflow-hidden"
              >
                <div className="bg-brand-dark text-white font-cond font-bold text-xs px-3 grid place-items-center min-w-[40px] tracking-wider">
                  {m.id.slice(-2)}
                </div>
                <div className="flex-1 flex">
                  <Side code={home?.code ?? '?'} winner={winnerHome} side="home" />
                  <div className="grid place-items-center px-3 font-display text-xl text-black/40">
                    {m.status === 'finished' || m.status === 'live' ? `${m.homeScore}:${m.awayScore}` : 'vs'}
                  </div>
                  <Side code={away?.code ?? '?'} winner={winnerAway} side="away" />
                </div>
              </Link>
            );
          })}
        </div>
      </Section>

      <Section title="II. faza — Double Elimination">
        {stage2 === undefined && <div className="text-black/40 py-4">Učitavanje...</div>}
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

function Side({ code, winner, side }: { code: string; winner: boolean; side: 'home' | 'away' }) {
  return (
    <div
      className={classNames(
        'flex-1 px-3 py-3 font-display text-2xl',
        side === 'home' ? 'text-right' : 'text-left',
        winner ? (side === 'home' ? 'text-brand-blue' : 'text-brand-red') : 'text-black/70'
      )}
    >
      {code}
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

function BracketColumn({ title, slots, teamMap, matches }: any) {
  return (
    <div>
      <div className="font-cond text-xs tracking-widest uppercase text-black/40 mb-2">{title}</div>
      <div className="space-y-2">
        {slots.map((slot: any) => {
          const m = slot.matchId ? matches.find((x: any) => x.id === slot.matchId) : null;
          const home = m ? teamMap.get(m.homeId) : null;
          const away = m ? teamMap.get(m.awayId) : null;
          return (
            <div key={slot.id} className="card p-3">
              <div className="font-cond text-[10px] tracking-widest uppercase text-black/30">{slot.label}</div>
              {m ? (
                <Link to={`/utakmice/${m.id}`} className="flex items-center justify-between mt-1">
                  <span className="font-display text-xl">{home?.code ?? '?'}</span>
                  <span className="font-display text-base text-black/40">
                    {m.status !== 'scheduled' ? `${m.homeScore} : ${m.awayScore}` : 'vs'}
                  </span>
                  <span className="font-display text-xl">{away?.code ?? '?'}</span>
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
