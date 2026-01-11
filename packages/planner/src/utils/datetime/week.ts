import { startOfDay, addDays } from "./day";

export function startOfWeek(date: Date, weekStartsOn: number) {
  const d = startOfDay(date);
  const day = d.getDay(); // 0..6
  const diff = (day - weekStartsOn + 7) % 7;
  return addDays(d, -diff);
}

export function getISOWeekNumberUTC(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}


