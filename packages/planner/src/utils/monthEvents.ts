import type { MEvent } from "../types";
import { addDays, startOfDay } from "./datetime/day";
import { toDate } from "./datetime/parse";

export function eventsForDay(day: Date, events: MEvent[]) {
  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);

  return events
    .filter((e) => {
      const start = toDate(e.start);
      const end = toDate(e.end);
      if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
        return false;
      }
      return start < dayEnd && end > dayStart;
    })
    .sort((a, b) => +toDate(a.start) - +toDate(b.start));
}
