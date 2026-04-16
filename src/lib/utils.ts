export const DAY_NAMES_HR = ['Nedjelja', 'Ponedjeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak', 'Subota'];
export const MONTHS_HR = ['sijecnja', 'veljace', 'ozujka', 'travnja', 'svibnja', 'lipnja', 'srpnja', 'kolovoza', 'rujna', 'listopada', 'studenoga', 'prosinca'];

export function formatDateHr(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${DAY_NAMES_HR[d.getDay()]}, ${d.getDate()}. ${MONTHS_HR[d.getMonth()]} ${d.getFullYear()}.`;
}

export function shortDateHr(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

export function dayLabelShort(iso: string): string {
  const labels = ['NED', 'PON', 'UTO', 'SRI', 'CET', 'PET', 'SUB'];
  const d = new Date(iso + 'T00:00:00');
  return labels[d.getDay()];
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function classNames(...xs: (string | false | null | undefined)[]): string {
  return xs.filter(Boolean).join(' ');
}

export const STAGE_LABEL: Record<string, string> = {
  R1: 'I. kolo',
  WB: 'Pobjednicka',
  LB: 'Porazena',
  F: 'Finale',
};

export function compareMatchSchedule(
  a: { date: string; time: string; bracketSlot?: string | null },
  b: { date: string; time: string; bracketSlot?: string | null },
): number {
  const bySlot = (a.bracketSlot ?? '').localeCompare(b.bracketSlot ?? '', 'hr');
  if (bySlot !== 0) return bySlot;
  return `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`);
}

export function normalizePersonName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('hr');
}

export function tallyNames<T extends { playerName: string }>(rows: T[]) {
  const map = new Map<string, { name: string; count: number }>();
  for (const row of rows) {
    const display = row.playerName.trim().replace(/\s+/g, ' ');
    if (!display) continue;
    const key = normalizePersonName(display);
    const entry = map.get(key);
    if (entry) {
      entry.count += 1;
      if (display.length > entry.name.length) entry.name = display;
    } else {
      map.set(key, { name: display, count: 1 });
    }
  }
  return map;
}

export function getDivisionKey(value: string | null | undefined): 'm' | 'z' {
  if (!value) return 'm';
  return value.trim().toLocaleLowerCase('hr').startsWith('m') ? 'm' : 'z';
}

export function getDivisionLabel(value: string | null | undefined): string {
  return getDivisionKey(value) === 'm' ? 'Muski' : 'Ženski';
}
