import type { Goal } from '../lib/types';

const MATCH_LEN = 20;

interface Props {
  goals: Goal[];
  homeId: string;
  homeColor?: string;
  awayColor?: string;
}

export default function GoalTimeline({
  goals, homeId, homeColor = '#1d4e9e', awayColor = '#d42a3c',
}: Props) {
  return (
    <div className="pt-3.5 pb-1.5 relative">
      <div className="h-[3px] bg-[#edeef3] rounded relative">
        <div className="absolute left-1/2 -top-[3px] w-px h-[9px] bg-black/10" />
        {goals.map((g, i) => {
          const absMinute = (g.half === 'II' ? MATCH_LEN / 2 : 0) + g.minute;
          const pct = Math.min((absMinute / MATCH_LEN) * 100, 98);
          const isHome = g.teamId === homeId;
          const color = isHome ? homeColor : awayColor;
          return (
            <div
              key={i}
              title={`${g.playerName} (${g.minute}' ${g.half})`}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-[2.5px] border-white z-10"
              style={{ left: `${pct}%`, background: color, boxShadow: `0 0 0 1px ${color}33` }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] font-cond font-bold text-black/20 mt-1 tracking-wider">
        <span>I. pol.</span>
        <span>II. pol.</span>
      </div>
    </div>
  );
}
