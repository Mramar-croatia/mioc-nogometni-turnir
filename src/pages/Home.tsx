import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAllGoals, useMatches, useTeams } from '../lib/hooks';
import { useFollowedTeams } from '../lib/favorites';
import MatchCard from '../components/MatchCard';
import Countdown from '../components/Countdown';
import { SkeletonList, SkeletonMatchCard } from '../components/Skeleton';
import { formatDateHr, todayIso } from '../lib/utils';

export default function Home() {
  const matches = useMatches();
  const teams = useTeams();
  const allGoals = useAllGoals(matches);
  const { ids: followedIds } = useFollowedTeams();

  const stats = useMemo(() => {
    if (!matches) return null;
    const finished = matches.filter((m) => m.status === 'finished');
    const goalsCount = allGoals?.length ?? null;
    let topScorer: { name: string; goals: number } | null = null;
    if (allGoals) {
      const map = new Map<string, number>();
      for (const g of allGoals) {
        if (!g.playerName) continue;
        map.set(g.playerName, (map.get(g.playerName) ?? 0) + 1);
      }
      for (const [name, n] of map) {
        if (!topScorer || n > topScorer.goals) topScorer = { name, goals: n };
      }
    }
    return {
      total: matches.length,
      played: finished.length,
      remaining: matches.length - finished.length,
      goalsCount,
      topScorer,
    };
  }, [matches, allGoals]);

  if (matches === null || teams === null) {
    return (
      <div>
        <div className="text-center mb-7">
          <div className="pill bg-brand-blue/10 text-brand-blue mb-3">Školski turnir</div>
          <h1 className="font-display text-5xl tracking-wide leading-none">Nogometni turnir</h1>
        </div>
        <SkeletonMatchCard />
        <SkeletonList count={3} />
      </div>
    );
  }

  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));
  const today = todayIso();

  const live = matches.filter((m) => m.status === 'live');
  const todays = matches.filter((m) => m.date === today);
  const upcoming = matches
    .filter((m) => m.status === 'scheduled' && m.date >= today)
    .slice(0, 4);

  const heroMatch = live[0] ?? upcoming[0] ?? null;
  const heroLive = !!live[0];
  const recent = matches
    .filter((m) => m.status === 'finished')
    .slice(-3)
    .reverse();

  const followed = matches.filter(
    (m) => (followedIds.has(m.homeId) || followedIds.has(m.awayId)) && m.status !== 'finished'
  ).slice(0, 3);

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
          <p className="text-black/50">Raspored utakmica još nije objavljen.</p>
        </div>
      )}

      {heroMatch && (
        <Countdown
          match={heroMatch}
          home={teamMap.get(heroMatch.homeId)}
          away={teamMap.get(heroMatch.awayId)}
          live={heroLive}
        />
      )}

      {!empty && stats && (
        <div className="card p-4 mb-7">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Odigrano" value={`${stats.played} / ${stats.total}`} />
            <Stat label="Golova" value={stats.goalsCount ?? '—'} />
            <Stat
              label="Vodeći strijelac"
              value={stats.topScorer ? `${stats.topScorer.name.split(' ')[0]} · ${stats.topScorer.goals}` : '—'}
              small
            />
          </div>
        </div>
      )}

      {live.length > 1 && (
        <Section title="Uživo">
          {live.slice(1).map((m, i) => (
            <MatchCard key={m.id} match={m} home={teamMap.get(m.homeId)} away={teamMap.get(m.awayId)} index={i} />
          ))}
        </Section>
      )}

      {followed.length > 0 && (
        <Section title="★ Ekipe koje pratiš">
          {followed.map((m, i) => (
            <MatchCard key={m.id} match={m} home={teamMap.get(m.homeId)} away={teamMap.get(m.awayId)} index={i} compact />
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

function Stat({ label, value, small }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div className="text-center min-w-0">
      <div className={small ? 'font-cond font-bold text-base truncate' : 'font-display text-2xl leading-none'}>{value}</div>
      <div className="font-cond text-[10px] uppercase tracking-widest text-black/40 mt-1">{label}</div>
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
