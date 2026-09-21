import type { MEvent } from "@musti/planner";
import { toDate, toISODateKeyLocal } from "@musti/planner";
import { eventToTitle } from "@/utils/calendar/format";
import { listLocalDaysOverlapped } from "./listLocalDaysOverlapped";

export type DayEventMarker = {
  id: string;
  color: string;
  title: string;
  startMs: number;
};

export function buildDayEventIndex(
  events: MEvent[]
): Map<string, DayEventMarker[]> {
  const map = new Map<string, DayEventMarker[]>();

  for (const ev of events) {
    const s = toDate((ev as { start?: string }).start ?? "");
    const e = toDate((ev as { end?: string }).end ?? "");
    if (!Number.isFinite(s.getTime()) || !Number.isFinite(e.getTime())) continue;
    if (e <= s) continue;

    const id = String(ev.id ?? "");
    if (!id) continue;

    const color = ev.color ?? "#4CAF50";
    const title =
      ev.title ??
      (ev as { name?: string }).name ??
      eventToTitle(ev as Parameters<typeof eventToTitle>[0]);
    const marker: DayEventMarker = {
      id,
      color,
      title: String(title ?? ""),
      startMs: s.getTime(),
    };

    for (const day of listLocalDaysOverlapped(s, e)) {
      const key = toISODateKeyLocal(day);
      const list = map.get(key) ?? [];
      if (list.some((m) => m.id === id)) continue;
      list.push(marker);
      map.set(key, list);
    }
  }

  for (const [key, list] of map) {
    list.sort((a, b) => a.startMs - b.startMs);
    map.set(key, list);
  }

  return map;
}

export function getDayEventMarkers(
  index: Map<string, DayEventMarker[]>,
  day: Date
): DayEventMarker[] {
  return index.get(toISODateKeyLocal(day)) ?? [];
}

export function dayHasEvents(
  index: Map<string, DayEventMarker[]>,
  day: Date
): boolean {
  return getDayEventMarkers(index, day).length > 0;
}
