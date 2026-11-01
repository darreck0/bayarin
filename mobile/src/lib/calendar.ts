export const TIME_ZONE = 'Asia/Manila';

export function manilaDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function isMonthKey(value: unknown): value is string {
  return typeof value === 'string' && /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(value);
}

export function shiftMonth(month: string, delta: number): string | null {
  if (!isMonthKey(month) || !Number.isInteger(delta)) return null;
  const [year, number] = month.split('-').map(Number);
  const index = year * 12 + number - 1 + delta;
  const nextYear = Math.floor(index / 12);
  if (nextYear < 1000 || nextYear > 9999) return null;
  return `${nextYear}-${String(index % 12 + 1).padStart(2, '0')}`;
}

export function dueDate(month: string, day: number): string {
  if (!isMonthKey(month) || !Number.isInteger(day) || day < 1 || day > 31) throw new Error('Invalid due date');
  const [year, number] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, number, 0)).getUTCDate();
  return `${month}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
}

export function monthLabel(month: string): string {
  if (!isMonthKey(month)) throw new Error('Invalid month');
  return new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T12:00:00Z`));
}

export function shortDueDate(date: string): string {
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}
