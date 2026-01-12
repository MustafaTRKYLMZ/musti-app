import { addDays, startOfDay } from "@musti/planner";

/**
 * Returns local startOfDay dates that the [start, end) interval overlaps.
 * Uses (end - 1ms) to avoid counting the next day when end is exactly at 00:00.
 */
export function listLocalDaysOverlapped(start: Date, end: Date): Date[] {
  const endMinus = new Date(end.getTime() - 1);
  if (!Number.isFinite(endMinus.getTime())) return [];

  let cur = startOfDay(start);
  const last = startOfDay(endMinus);
  const out: Date[] = [];

  while (cur <= last) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}
