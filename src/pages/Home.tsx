import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAllGoals, useMatches, useTeams } from '../lib/hooks';
import { useFollowedTeams } from '../lib/favorites';
import MatchCard from '../components/MatchCard';
import MatchRow from '../components/MatchRow';
import Countdown from '../components/Countdown';
import { SkeletonList, SkeletonMatchCard } from '../components/Skeleton';
import type { Match, Team } from '../lib/types';
import { todayIso } from '../lib/utils';

export default function Home() {
  const matches = useMatches();
  const teams = useTeams();
  const allGoals = useAllGoals(matches);
  const { ids: followedIds } = useFollowedTeams();

  const stats = useMemo(() => {
    if (!matches) return null;
    const finished = matches.filter((m) => m.status === 'finished');
    const goalsCount = allGoals?.length ?? null;
    return {
      total: matches.length,
      played: finished.length,
      goalsCount,
    };
  }, [matches, allGoals]);

  if (matches === null || teams === null) {
    return (
      <div className="space-y-8">
        <PageHeader />
        <SkeletonMatchCard />
        <SkeletonList count={3} />
      </div>
    );
  }

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const today = todayIso();

  const live = matches.filter((m) => m.status === 'live');
  const todays = matches.filter((m) => m.date === today);
  const upcoming = matches
    .filter((m) => m.status === 'scheduled' && m.date >= today)
    .slice(0, 4);

  const heroMatch = live[0] ?? upcoming[0] ?? null;
  const recent = matches.filter((m) => m.status === 'finished').slice(-3).reverse();
  const followed = matches
    .filter((m) => (followedIds.has(m.homeId) || followedIds.has(m.awayId)) && m.status !== 'finished')
    .slice(0, 3);

  const empty = matches.length === 0;

  return (
    <div className="space-y-8">
      <PageHeader />

      {empty && (
        <div className="card p-8 text-center">
          <p className="text-black/50">Raspored utakmica jos nije objavljen.</p>
        </div>
      )}

      {heroMatch && (
        <Countdown
          match={heroMatch}
          home={teamMap.get(heroMatch.homeId)}
          away={teamMap.get(heroMatch.awayId)}
          live={heroMatch.status === 'live'}
        />
      )}

      {!empty && stats && (
        <div className="card p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Stat
              label="Odigrano"
              value={`${stats.played}`}
              suffix={` / ${stats.total}`}
              accent="blue"
            />
            <Stat
              label="Golova"
              value={stats.goalsCount ?? '—'}
              accent="red"
            />
          </div>
        </div>
      )}

      {live.length > 1 && (
        <Section title="Uzivo" accent="red">
          {live.slice(1).map((m, i) => (
            <MatchCard key={m.id} match={m} home={teamMap.get(m.homeId)} away={teamMap.get(m.awayId)} index={i} />
          ))}
        </Section>
      )}

      {followed.length > 0 && (
        <Section title="Ekipe koje pratis">
          <CompactList list={followed} teamMap={teamMap} />
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
          <CompactList list={recent} teamMap={teamMap} />
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section title="Sljedece utakmice" link={{ to: '/utakmice', label: 'Raspored' }}>
          <CompactList list={upcoming} teamMap={teamMap} />
        </Section>
      )}
    </div>
  );
}

function PageHeader() {
  return (
    <header>
      <div className="font-cond text-xs font-bold uppercase tracking-[0.18em] text-black/45">
        Pregled turnira
      </div>
      <h1 className="font-display text-6xl leading-none tracking-[0.04em] mt-2">
        MIOC turnir
      </h1>
      <p className="text-black/55 mt-3">Podatci se ažuriraju u realnom vremenu.</p>
    </header>
  );
}

function Stat({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  accent: 'blue' | 'red';
}) {
  const accentClass = accent === 'blue' ? 'bg-brand-blue' : 'bg-brand-red';
  return (
    <div className="relative rounded-xl border border-black/6 bg-black/[0.02] px-4 py-4 min-w-0 text-center overflow-hidden">
      <span className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full ${accentClass}`} />
      <div className="font-display text-3xl leading-none">
        {value}
        {suffix && <span className="text-black/30 text-2xl">{suffix}</span>}
      </div>
      <div className="font-cond text-[10px] uppercase tracking-[0.16em] text-black/40 mt-2">{label}</div>
    </div>
  );
}

function Section({
  title,
  link,
  accent,
  children,
}: {
  title: string;
  link?: { to: string; label: string };
  accent?: 'red';
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-block w-1 h-4 rounded-full ${
              accent === 'red' ? 'bg-brand-red' : 'bg-brand-dark'
            }`}
          />
          <h2 className="font-cond font-extrabold text-xs tracking-[0.18em] uppercase text-black/55">
            {title}
          </h2>
        </div>
        {link && (
          <Link
            to={link.to}
            className="font-cond font-bold text-[11px] tracking-[0.16em] uppercase text-brand-blue hover:text-brand-dark transition"
          >
            {link.label} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function CompactList({ list, teamMap }: { list: Match[]; teamMap: Map<string, Team> }) {
  return (
    <div className="card p-3 sm:p-4">
      {list.map((m) => (
        <MatchRow key={m.id} match={m} home={teamMap.get(m.homeId)} away={teamMap.get(m.awayId)} showDate />
      ))}
    </div>
  );
}
