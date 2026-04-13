import { Link } from 'react-router-dom';
import { useMatches, useTeams } from '../lib/hooks';
import MatchCard from '../components/MatchCard';
import Loading from '../components/Loading';
import { formatDateHr, todayIso } from '../lib/utils';

export default function Home() {
  const matches = useMatches();
  const teams = useTeams();

  if (matches === null || teams === null) return <Loading />;

  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));
  const today = todayIso();

  const live = matches.filter((m) => m.status === 'live');
  const todays = matches.filter((m) => m.date === today);
  const upcoming = matches
    .filter((m) => m.status === 'scheduled' && m.date >= today)
    .slice(0, 4);
  const recent = matches
    .filter((m) => m.status === 'finished')
    .slice(-3)
    .reverse();

  const empty = matches.length === 0;

  return (
    <div>
      <div className="text-center mb-7">
        <div className="pill bg-brand-blue/10 text-brand-blue mb-3">Školski turnir</div>
        <h1 className="font-display text-5xl tracking-wide leading-none">Nogometni turnir</h1>
        <p className="font-semibold text-black/30 mt-2">{formatDateHr(today)}</p>
      </div>

      {empty && (
        <div className="card p-6 text-center">
          <p className="text-black/50 mb-3">Turnir još nije inicijaliziran.</p>
          <Link to="/admin/login" className="btn-primary">Otvori admin</Link>
        </div>
      )}

      {live.length > 0 && (
        <Section title="Uživo">
          {live.map((m, i) => (
            <MatchCard key={m.id} match={m} home={teamMap.get(m.homeId)} away={teamMap.get(m.awayId)} index={i} />
          ))}
        </Section>
      )}

      {todays.length > 0 && (
        <Section title="Danas">
          {todays.map((m, i) => (
            <MatchCard key={m.id} match={m} home={teamMap.get(m.homeId)} away={teamMap.get(m.awayId)} index={i} />
          ))}
        </Section>
      )}

      {recent.length > 0 && (
        <Section title="Posljednji rezultati" link={{ to: '/utakmice', label: 'Sve' }}>
          {recent.map((m, i) => (
            <MatchCard key={m.id} match={m} home={teamMap.get(m.homeId)} away={teamMap.get(m.awayId)} index={i} compact />
          ))}
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section title="Slijedeće utakmice" link={{ to: '/utakmice', label: 'Raspored' }}>
          {upcoming.map((m, i) => (
            <MatchCard key={m.id} match={m} home={teamMap.get(m.homeId)} away={teamMap.get(m.awayId)} index={i} compact />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, link, children }: { title: string; link?: { to: string; label: string }; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-cond font-extrabold text-xs tracking-widest uppercase text-black/50">{title}</h2>
        {link && <Link to={link.to} className="font-cond font-bold text-xs tracking-wider uppercase text-brand-blue">{link.label} →</Link>}
      </div>
      {children}
    </section>
  );
}
