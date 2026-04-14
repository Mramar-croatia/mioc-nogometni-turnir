import type { Team } from '../lib/types';
import { classNames } from '../lib/utils';

interface Props {
  team?: Team | null;
  size?: number;
  className?: string;
  rounded?: 'full' | 'md' | 'lg';
}

export default function TeamCrest({ team, size = 32, className, rounded = 'full' }: Props) {
  const radius = rounded === 'full' ? 'rounded-full' : rounded === 'lg' ? 'rounded-xl' : 'rounded-md';
  const style: React.CSSProperties = { width: size, height: size };

  if (team?.crestUrl) {
    return (
      <img
        src={team.crestUrl}
        alt={team.code}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className={classNames('object-cover bg-white shrink-0', radius, className)}
        style={style}
      />
    );
  }

  const color = team?.color || '#1d4e9e';
  const label = (team?.code ?? '?').slice(0, 2).toUpperCase();
  const fontSize = Math.max(10, Math.round(size * 0.42));

  return (
    <div
      className={classNames('grid place-items-center font-display shrink-0 select-none', radius, className)}
      style={{
        ...style,
        background: `${color}1a`,
        color,
        border: `1.5px solid ${color}33`,
        fontSize,
        lineHeight: 1,
      }}
      aria-label={team?.code}
    >
      {label}
    </div>
  );
}
