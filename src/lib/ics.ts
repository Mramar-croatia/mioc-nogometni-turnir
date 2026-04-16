import type { Match, Team } from './types';

function pad(n: number) { return String(n).padStart(2, '0'); }

function toIcsDate(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const dt = new Date(y, m - 1, d, hh, mm, 0);
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

function addMinutes(date: string, time: string, mins: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const dt = new Date(y, m - 1, d, hh, mm + mins, 0);
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

export function buildIcs(
  matches: Match[],
  teams: Map<string, Team>,
  calName: string
): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MIOC Turnir//HR',
    `X-WR-CALNAME:${escapeText(calName)}`,
  ];
  for (const m of matches) {
    const home = teams.get(m.homeId)?.code ?? '?';
    const away = teams.get(m.awayId)?.code ?? '?';
    lines.push(
      'BEGIN:VEVENT',
      `UID:mioc-${m.id}@turnir`,
      `DTSTAMP:${toIcsDate(m.date, m.time)}`,
      `DTSTART:${toIcsDate(m.date, m.time)}`,
      `DTEND:${addMinutes(m.date, m.time, m.durationMin || 20)}`,
      `SUMMARY:${escapeText(`${home} vs ${away}`)}`,
      `LOCATION:${escapeText('XV. gimnazija, Zagreb')}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcs(filename: string, contents: string) {
  const blob = new Blob([contents], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
