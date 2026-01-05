import type { MEvent, WeekViewConfig } from "../types";
import { addDays, minutesOfDay, sameDay, startOfWeek, toDate } from "./helpers";
import { placeOverlaps } from "./overlap";

export type WeekBlock = {
  id: string;
  event: MEvent;
  dayIndex: number; // 0..6
  top: number;
  height: number;
  col: number;
  colCount: number;
};

export function layoutWeek(
  date: Date,
  events: MEvent[],
  config: { weekStartsOn: number },
  week: WeekViewConfig
): { weekStart: Date; blocks: WeekBlock[] } {
  const weekStart = startOfWeek(date, config.weekStartsOn);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const dayBuckets: MEvent[][] = Array.from({ length: 7 }, () => []);
  for (const e of events) {
    const s = toDate(e.start);
    const dayIndex = days.findIndex((d) => sameDay(d, s));
    if (dayIndex >= 0) dayBuckets[dayIndex].push(e);
  }

  const startMinVis = week.startHour * 60;
  const endMinVis = week.endHour * 60;

  const blocks: WeekBlock[] = [];

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const dayEvents = dayBuckets[dayIndex];

    const intervals = dayEvents
      .map((e) => {
        const s = minutesOfDay(toDate(e.start));
        const en = minutesOfDay(toDate(e.end));
        return {
          id: e.id,
          startMin: Math.max(s, startMinVis),
          endMin: Math.min(en, endMinVis),
        };
      })
      .filter((x) => x.endMin > x.startMin);

    const overlap = placeOverlaps(intervals);

    for (const it of intervals) {
      const ov = overlap.find((o) => o.id === it.id) ?? { id: it.id, col: 0, colCount: 1 };
      const top = (it.startMin - startMinVis) * week.pxPerMinute;
      const height = (it.endMin - it.startMin) * week.pxPerMinute;
      const event = dayEvents.find((e) => e.id === it.id)!;

      blocks.push({
        id: it.id,
        event,
        dayIndex,
        top,
        height,
        col: ov.col,
        colCount: ov.colCount,
      });
    }
  }

  return { weekStart, blocks };
}
