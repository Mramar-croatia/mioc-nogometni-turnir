import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Match, Team } from '../lib/types';

function parseMatchDate(m: Match): number {
  const [y, mo, d] = m.date.split('-').map(Number);
  const [h, mi] = m.time.split(':').map(Number);
  return new Date(y, mo - 1, d, h, mi, 0).getTime();
}

function format(ms: number): { d: number; h: number; m: number; s: number } {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { d, h, m, s };
}

interface Props {
  match: Match;
  home?: Team;
  away?: Team;
  live?: boolean;
}

export default function Countdown({ match, home, away, live }: Props) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const target = parseMatchDate(match);
  const diff = target - now;
  const parts = format(diff);

  const homeColor = home?.color || '#1d4e9e';
  const awayColor = away?.color || '#d42a3c';

  return (
    <Link
      to={`/utakmice/${match.id}`}
      className="block card overflow-hidden mb-7 relative"
    >
      <div
        className="h-1.5"
        style={{
          background: `linear-gradient(90deg, ${homeColor} 0%, ${homeColor} 48%, transparent 48%, transparent 52%, ${awayColor} 52%, ${awayColor} 100%)`,
        }}
      />
      <div className="p-5 text-center">
        <div className="font-cond text-[11px] tracking-widest uppercase text-black/45 mb-2 flex items-center justify-center gap-2">
          {live ? (
            <>
              <span className="relative inline-flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-brand-red animate-livePulse" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-brand-red" />
              </span>
              <span className="text-brand-red">Uzivo</span>
            </>
          ) : (
            <>Sljedeca utakmica</>
          )}
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className="flex-1 flex items-center justify-end min-w-0">
            <div className="font-display text-3xl truncate" style={{ color: homeColor }}>{home?.code ?? '?'}</div>
          </div>
          <div className="font-display text-xl text-black/30 shrink-0">vs</div>
          <div className="flex-1 flex items-center justify-start min-w-0">
            <div className="font-display text-3xl truncate" style={{ color: awayColor }}>{away?.code ?? '?'}</div>
          </div>
        </div>

        {!live && diff > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2 sm:gap-3">
            {parts.d > 0 && <Unit value={parts.d} label="dan" />}
            <Unit value={parts.h} label="h" />
            <Unit value={parts.m} label="min" />
            <Unit value={parts.s} label="s" />
          </div>
        )}

        {!live && diff <= 0 && (
          <div className="mt-3 font-cond text-xs uppercase tracking-widest text-brand-red">
            Uskoro pocinje
          </div>
        )}
      </div>
    </Link>
  );
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-brand-dark text-white rounded-xl px-3 py-2 min-w-[56px]">
      <div key={value} className="font-display text-2xl leading-none animate-pop">
        {String(value).padStart(2, '0')}
      </div>
      <div className="font-cond text-[9px] uppercase tracking-widest text-white/50 mt-0.5">{label}</div>
    </div>
  );
}
