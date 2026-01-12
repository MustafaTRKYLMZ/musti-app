import { addMinutes } from ".";
import { MEvent } from "../types";
import { maxDate, minDate } from "./datetime/compare";
import { addDays, startOfDay } from "./datetime/day";
import { toISODateKeyLocal } from "./datetime/iso";

type SegEvent = MEvent & { __seg?: true; __parentId?: string };


export function segmentEventsForWeek(
  events: MEvent[],
  weekStart: Date,
  startMinVis: number,
  endMinVis: number
): SegEvent[] {
  const weekEndExclusive = addDays(weekStart, 7);
  const out: SegEvent[] = [];

  for (const e of events) {
    const s = new Date(e.start);
    const en = new Date(e.end);

    if (en <= weekStart || s >= weekEndExclusive) continue;

    const sW = maxDate(s, weekStart);
    const eW = minDate(en, weekEndExclusive);

    const endMinus1ms = new Date(eW.getTime() - 1);
    const isMultiDay =
      startOfDay(sW).getTime() !== startOfDay(endMinus1ms).getTime();

    if (!isMultiDay) {
      out.push(e as SegEvent);
      continue;
    }

    let curDay = startOfDay(sW);
    while (curDay < eW) {
      const nextDay = addDays(curDay, 1);

      const daySegStart = maxDate(sW, curDay);
      const daySegEnd = minDate(eW, nextDay);

      const visStart = addMinutes(curDay, startMinVis);
      const visEnd = addMinutes(curDay, endMinVis);

      const segStart = maxDate(daySegStart, visStart);
      const segEnd = minDate(daySegEnd, visEnd);

      if (segEnd > segStart) {
        out.push({
          ...(e as any),
          __seg: true,
          __parentId: e.id,
          id: `${e.id}__${toISODateKeyLocal(curDay)}`,
          start: segStart.toISOString(),
          end: segEnd.toISOString(),
        });
      }

      curDay = nextDay;
    }
  }

  return out;
}
