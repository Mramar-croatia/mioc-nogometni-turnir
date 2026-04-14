import type { Match, Team } from './types';
import { STAGE_LABEL } from './utils';

function escapeCsv(value: string | number | null | undefined): string {
  const text = value == null ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildResultsCsv(matches: Match[], teams: Map<string, Team>): string {
  const rows: Array<Array<string | number>> = [
    ['Stage', 'Date', 'Time', 'Home', 'Away', 'Home Score', 'Away Score', 'Winner', 'Penalties', 'Status'],
  ];

  for (const match of matches) {
    const homeCode = teams.get(match.homeId)?.code ?? match.homeId;
    const awayCode = teams.get(match.awayId)?.code ?? match.awayId;
    const winnerCode = match.winnerId ? (teams.get(match.winnerId)?.code ?? match.winnerId) : '';
    const penalties = match.penalties ? `${match.penalties.home}:${match.penalties.away}` : '';
    rows.push([
      STAGE_LABEL[match.stage] ?? match.stage,
      match.date,
      match.time,
      homeCode,
      awayCode,
      match.homeScore,
      match.awayScore,
      winnerCode,
      penalties,
      match.status,
    ]);
  }

  return rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
}

export function downloadCsv(filename: string, contents: string) {
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
