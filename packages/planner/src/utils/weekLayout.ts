import type { MEvent, WeekViewConfig } from "../types";
import { addDays, sameDay } from "./datetime/day";
import { minutesOfDay } from "./datetime/minutes";
import { toDate } from "./datetime/parse";
import { startOfWeek } from "./datetime/week";
import { placeOverlaps } from "./overlap";

export type WeekBlock = {
  id: string;
  event: MEvent;
  dayIndex: number;
  top: number;
  height: number;
  col: number;
  colCount: number;
};

const DAY_START = 0;
const DAY_END = 24 * 60;

export function layoutWeek(
  date: Date,
  events: MEvent[],
  config: { weekStartsOn: number },
  week: WeekViewConfig
): { weekStart: Date; blocks: WeekBlock[] } {
  const weekStart = startOfWeek(date, config.weekStartsOn);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const viewStart = week.startHour * 60;
  const viewEnd = week.endHour * 60;

  const blocks: WeekBlock[] = [];

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const day = days[dayIndex];
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
    const nextDayStart = addDays(dayStart, 1);

    const dayEvents = events.filter((e) => {
      const s = toDate(e.start);
      const en = toDate(e.end);
      return en > dayStart && s < nextDayStart;
    });

    const intervals = dayEvents
      .map((e) => {
        const s = toDate(e.start);
        const en = toDate(e.end);

        const startsToday = sameDay(s, dayStart);
        const endsToday = sameDay(en, dayStart);

        const dayStartMin = startsToday ? minutesOfDay(s) : DAY_START;
        const dayEndMin = endsToday ? minutesOfDay(en) : DAY_END;

        const startMin = Math.max(dayStartMin, viewStart);
        const endMin = Math.min(dayEndMin, viewEnd);

        return {
          id: `${e.id}__${dayIndex}`,
          eventId: e.id,
          startMin,
          endMin,
        };
      })
      .filter((x) => x.endMin > x.startMin);

    const overlap = placeOverlaps(intervals);

    for (const it of intervals) {
      const ov =
        overlap.find((o) => o.id === it.id) ?? { id: it.id, col: 0, colCount: 1 };

      blocks.push({
        id: it.id,
        event: events.find((e) => e.id === it.eventId)!,
        dayIndex,
        top: (it.startMin - viewStart) * week.pxPerMinute,
        height: (it.endMin - it.startMin) * week.pxPerMinute,
        col: ov.col,
        colCount: ov.colCount,
      });
    }
  }

  return { weekStart, blocks };
}
