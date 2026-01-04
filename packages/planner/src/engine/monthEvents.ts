import type { Event } from "../types";
import { sameDay, toDate } from "./helpers";

export function eventsForDay(day: Date, events: Event[]) {
  return events
    .filter((e) => sameDay(toDate(e.start), day))
    .sort((a, b) => +toDate(a.start) - +toDate(b.start));
}
