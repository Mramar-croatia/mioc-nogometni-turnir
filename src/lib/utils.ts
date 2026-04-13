export const DAY_NAMES_HR = ['Nedjelja', 'Ponedjeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak', 'Subota'];
export const MONTHS_HR = ['siječnja','veljače','ožujka','travnja','svibnja','lipnja','srpnja','kolovoza','rujna','listopada','studenoga','prosinca'];

export function formatDateHr(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${DAY_NAMES_HR[d.getDay()]}, ${d.getDate()}. ${MONTHS_HR[d.getMonth()]} ${d.getFullYear()}.`;
}

export function shortDateHr(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

export function dayLabelShort(iso: string): string {
  const labels = ['NED', 'PON', 'UTO', 'SRI', 'ČET', 'PET', 'SUB'];
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
  WB: 'Pobjednička',
  LB: 'Poražena',
  F: 'Finale',
  GF: 'Veliko finale',
};
