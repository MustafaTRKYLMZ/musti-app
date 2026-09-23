import type { MEvent } from "@musti/planner/src/types";
import {
  addDays,
  packWeekSegments,
  startOfWeek,
  toDate,
  toISODateKeyLocal,
  type WeekSeg,
} from "@musti/planner";
import { plannerTheme } from "@musti/ui-native";
import { TOTAL_DAYS, WEEKS_IN_GRID } from "@/config/timeConfigs";
import { eventToTitle } from "@/utils/calendar/format";
import {
  startOfMonth,
  stripLeadingTimeLabel,
} from "@/utils/calendar/monthViewUtils";
import { listLocalDaysOverlapped } from "@/utils/calendar/listLocalDaysOverlapped";
import type { DayBar, DayInlineItem } from "@/components/planner/DayCard";

const { colors } = plannerTheme;

export type MonthPageData = {
  monthIndex: number;
  weeks: Date[][];
  barsByKey: Record<string, DayBar[]>;
  inlineByKey: Record<string, DayInlineItem[]>;
};

type CacheEntry = {
  eventsFingerprint: string;
  data: MonthPageData;
};

function eventsFingerprint(events: MEvent[]): string {
  if (events.length === 0) return "0";
  const first = events[0];
  const last = events[events.length - 1];
  return `${events.length}:${first?.id ?? ""}:${last?.id ?? ""}:${(first as { updatedAt?: string })?.updatedAt ?? ""}:${(last as { updatedAt?: string })?.updatedAt ?? ""}`;
}

const pageCache = new Map<string, CacheEntry>();
const MAX_CACHE = 18;

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function buildMonthGrid(baseDate: Date, weekStartsOn: number) {
  const monthIndex = baseDate.getMonth();
  const mStart = startOfMonth(baseDate);
  const gridStart = startOfWeek(mStart, weekStartsOn);
  const gridDays = Array.from({ length: TOTAL_DAYS }, (_, i) =>
    addDays(gridStart, i)
  );
  const weeks = Array.from({ length: WEEKS_IN_GRID }, (_, w) =>
    gridDays.slice(w * 7, w * 7 + 7)
  );
  return { monthIndex, weeks };
}

function computeEventLayout(
  weeks: Date[][],
  events: MEvent[]
): Pick<MonthPageData, "barsByKey" | "inlineByKey"> {
  const barsByKey: Record<string, DayBar[]> = {};
  const inlineByKey: Record<string, DayInlineItem[]> = {};

  for (let wi = 0; wi < weeks.length; wi++) {
    const weekDays = weeks[wi];
    const weekKeys = weekDays.map(toISODateKeyLocal);
    const segs: WeekSeg[] = [];
    const inlineTmp: Record<
      string,
      { color: string; title: string; t: number }[]
    > = {};

    for (const ev of events) {
      const s = toDate((ev as MEvent & { start: unknown }).start);
      const e = toDate((ev as MEvent & { end: unknown }).end);
      if (!Number.isFinite(s.getTime()) || !Number.isFinite(e.getTime())) {
        continue;
      }
      if (e <= s) continue;

      const id = String((ev as MEvent & { id?: string }).id ?? "");
      const color =
        (ev as MEvent & { color?: string }).color ?? colors.primary;
      const rawTitle =
        (ev as MEvent & { title?: string; name?: string }).title ??
        (ev as MEvent & { name?: string }).name ??
        eventToTitle(ev as MEvent);
      const title = stripLeadingTimeLabel(String(rawTitle ?? ""));

      const days = listLocalDaysOverlapped(s, e);
      if (!days.length) continue;

      const dayKeySet = new Set(days.map(toISODateKeyLocal));
      const visibleCols: number[] = [];
      for (let col = 0; col < 7; col++) {
        if (dayKeySet.has(weekKeys[col])) visibleCols.push(col);
      }
      if (!visibleCols.length) continue;

      if (days.length === 1) {
        const k = weekKeys[visibleCols[0]];
        (inlineTmp[k] ||= []).push({ color, title, t: s.getTime() });
        continue;
      }

      const startCol = Math.min(...visibleCols);
      const endCol = Math.max(...visibleCols);
      segs.push({ id, color, title, startCol, endCol });
    }

    const { placement } = packWeekSegments(segs);

    for (const seg of segs) {
      const row = placement.get(seg.id) ?? 0;
      const spanLen = seg.endCol - seg.startCol + 1;
      const anchorCol = seg.startCol + Math.floor(spanLen / 2);

      for (let col = seg.startCol; col <= seg.endCol; col++) {
        const k = weekKeys[col];
        (barsByKey[k] ||= []).push({
          id: seg.id,
          color: seg.color,
          contL: col > seg.startCol,
          contR: col < seg.endCol,
          row,
          title: col === anchorCol ? seg.title : null,
        });
      }
    }

    for (const k of Object.keys(inlineTmp)) {
      inlineTmp[k].sort((a, b) => a.t - b.t);
      inlineByKey[k] = inlineTmp[k].map(({ color, title }) => ({
        color,
        title,
      }));
    }
  }

  return { barsByKey, inlineByKey };
}

export function getMonthPageData(
  baseDate: Date,
  events: MEvent[],
  weekStartsOn: number
): MonthPageData {
  const key = monthKey(baseDate);
  const fingerprint = eventsFingerprint(events);
  const cached = pageCache.get(key);
  if (cached && cached.eventsFingerprint === fingerprint) {
    return cached.data;
  }

  const { monthIndex, weeks } = buildMonthGrid(baseDate, weekStartsOn);
  const layout = computeEventLayout(weeks, events);
  const data: MonthPageData = { monthIndex, weeks, ...layout };

  pageCache.set(key, { eventsFingerprint: fingerprint, data });
  if (pageCache.size > MAX_CACHE) {
    const first = pageCache.keys().next().value;
    if (first) pageCache.delete(first);
  }

  return data;
}

export function prefetchAdjacentMonths(
  date: Date,
  events: MEvent[],
  weekStartsOn: number
) {
  const y = date.getFullYear();
  const m = date.getMonth();
  getMonthPageData(new Date(y, m - 1, 1), events, weekStartsOn);
  getMonthPageData(new Date(y, m + 1, 1), events, weekStartsOn);
}
