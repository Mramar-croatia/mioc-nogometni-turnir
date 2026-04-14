import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMatch, useGoals, useCards, useTeam, useTeams } from '../lib/hooks';
import MatchCard from '../components/MatchCard';
import Loading from '../components/Loading';
import { classNames, formatDateHr, STAGE_LABEL } from '../lib/utils';
import { buildIcs, downloadIcs } from '../lib/ics';

export default function MatchDetail() {
  const { id } = useParams();
  const match = useMatch(id);
  const goals = useGoals(id);
  const cards = useCards(id);
  const home = useTeam(match?.homeId);
  const away = useTeam(match?.awayId);
  const teams = useTeams();
  const [copied, setCopied] = useState(false);

  if (match === undefined) return <Loading />;
  if (match === null) return <div className="text-center py-10">Utakmica nije pronađena.</div>;

  async function share() {
    if (!match) return;
    const homeCode = home?.code ?? '?';
    const awayCode = away?.code ?? '?';
    const scoreText = match.status !== 'scheduled'
      ? `${homeCode} ${match.homeScore} : ${match.awayScore} ${awayCode}`
      : `${homeCode} vs ${awayCode}`;
    const text = `${scoreText} — MIOC Turnir`;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'MIOC Turnir', text, url });
        return;
      }
    } catch { /* user cancelled */ }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  }

  function exportIcs() {
    if (!match || !teams) return;
    const map = new Map(teams.map((t) => [t.id, t]));
    const homeCode = map.get(match.homeId)?.code ?? '?';
    const awayCode = map.get(match.awayId)?.code ?? '?';
    downloadIcs(
      `${homeCode}-vs-${awayCode}.ics`,
      buildIcs([match], map, `${homeCode} vs ${awayCode}`)
    );
  }

  const mvpTeamCode = match.mvpTeamId === match.homeId ? home?.code
    : match.mvpTeamId === match.awayId ? away?.code : null;

  return (
    <div>
      <Link to="/utakmice" className="font-cond text-xs tracking-widest uppercase text-black/40 mb-3 inline-block">
        ← Sve utakmice
      </Link>

      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <span className="pill bg-brand-blue/10 text-brand-blue">{STAGE_LABEL[match.stage]}</span>
        <span className="text-xs text-black/40 font-cond uppercase tracking-wider">
          {formatDateHr(match.date)} · {match.time}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={share}
            className="pill bg-black/5 text-black/55 hover:bg-black/10"
            title="Podijeli"
          >
            {copied ? 'Kopirano ✓' : 'Podijeli'}
          </button>
          {match.status !== 'finished' && (
            <button
              onClick={exportIcs}
              className="pill bg-black/5 text-black/55 hover:bg-black/10"
              title="Dodaj u kalendar"
            >
              + Kalendar
            </button>
          )}
        </div>
      </div>

      <MatchCard
        match={match}
        home={home ?? undefined}
        away={away ?? undefined}
        goals={goals}
        linkable={false}
      />

      {match.mvpName && (
        <div className="card p-4 mt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-blue/10 text-brand-blue grid place-items-center font-display text-xl">★</div>
          <div className="flex-1 min-w-0">
            <div className="font-cond text-[10px] uppercase tracking-widest text-black/40">Igrač utakmice</div>
            <div className="font-bold truncate">{match.mvpName}</div>
            {mvpTeamCode && <div className="text-xs text-black/50 font-cond uppercase tracking-wider">{mvpTeamCode}</div>}
          </div>
        </div>
      )}

      {match.commentary && (
        <div className="card p-4 mt-4">
          <div className="font-cond text-[10px] uppercase tracking-widest text-black/40 mb-1">Osvrt</div>
          <p className="whitespace-pre-wrap leading-relaxed">{match.commentary}</p>
        </div>
      )}

      {cards.length > 0 && (
        <div className="mt-5">
          <h2 className="font-cond font-extrabold text-xs tracking-widest uppercase text-black/45 mb-3">Kartoni</h2>
          <div className="card divide-y divide-black/5">
            {cards.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className={classNames(
                  'w-4 h-5 rounded-sm shrink-0',
                  c.color === 'yellow' ? 'bg-yellow-400' : 'bg-brand-red'
                )} />
                <span className="font-cond text-xs font-bold text-black/40 w-14">{c.minute}' {c.half}</span>
                <span className="flex-1 font-medium">{c.playerName}</span>
                <span className={classNames(
                  'pill',
                  c.teamId === match.homeId ? 'bg-brand-blue/10 text-brand-blue' : 'bg-brand-red/10 text-brand-red'
                )}>
                  {c.teamId === match.homeId ? home?.code : away?.code}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
