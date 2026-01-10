import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
} from "react-native";
import type { CalendarConfig, MEvent } from "@musti/planner/src/types";

import { plannerTheme, spacing } from "@musti/ui-native";
import { DayCard, DayInlineItem, DayBar } from "./DayCard";
import { TOTAL_DAYS, WEEKS_IN_GRID } from "@/config/timeConfigs";
import {
  eventToTitle,
  startOfWeek,
  addDays,
  sameDay,
  toDate,
} from "@musti/planner";
import { useCalendarUiStore } from "@/store/calendar/useCalendarUiStore";

const { colors } = plannerTheme;

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const pad2 = (n: number) => String(n).padStart(2, "0");
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const addMonths = (d: Date, delta: number) => {
  const day = d.getDate();
  const base = new Date(d.getFullYear(), d.getMonth() + delta, 1);
  const lastDay = new Date(
    base.getFullYear(),
    base.getMonth() + 1,
    0
  ).getDate();
  base.setDate(Math.min(day, lastDay));
  return base;
};

const stripLeadingTime = (s: string) =>
  s.replace(/^\s*\d{1,2}:\d{2}\s+/, "").trim();

const startOfDayLocal = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

const addDaysLocal = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const listDaysOverlapped = (start: Date, end: Date) => {
  const endMinus = new Date(end.getTime() - 1);
  if (!Number.isFinite(endMinus.getTime())) return [] as Date[];

  let cur = startOfDayLocal(start);
  const last = startOfDayLocal(endMinus);
  const out: Date[] = [];

  while (cur <= last) {
    out.push(cur);
    cur = addDaysLocal(cur, 1);
  }
  return out;
};

// week row içinde segment
type WeekSeg = {
  id: string;
  color: string;
  title: string;
  startCol: number; // 0..6
  endCol: number; // 0..6
};

// greedy row packing (çakışmayanlar aynı row)
function packWeekSegments(segs: WeekSeg[]) {
  const sorted = [...segs].sort((a, b) => {
    if (a.startCol !== b.startCol) return a.startCol - b.startCol;
    return b.endCol - b.startCol - (a.endCol - a.startCol);
  });

  const rows: { endCol: number }[] = [];
  const placement = new Map<string, number>();

  for (const s of sorted) {
    let placed = -1;
    for (let r = 0; r < rows.length; r++) {
      if (s.startCol > rows[r].endCol) {
        placed = r;
        break;
      }
    }
    if (placed === -1) {
      placed = rows.length;
      rows.push({ endCol: s.endCol });
    } else {
      rows[placed].endCol = s.endCol;
    }
    placement.set(s.id, placed);
  }

  return { placement, rowCount: rows.length };
}

export function MonthView(props: {
  config: CalendarConfig;
  colWidth: number;
  events: MEvent[];
  expanded: boolean;
  locale?: string;
  gridHeightAnim?: Animated.Value;
  onPressDay?: (d: Date) => void;
  maxMarkers?: number; // maxBars
  maxInlineItems?: number;
}) {
  const scrollRef = useRef<ScrollView | null>(null);

  const date = useCalendarUiStore((s) => s.date);
  const selectedDate = useCalendarUiStore((s) => s.selectedDate);
  const setDate = useCalendarUiStore((s) => s.setDate);

  const weekStartsOn = props.config.weekStartsOn ?? 1;
  const today = useMemo(() => new Date(), []);

  const pageWidth = props.colWidth * 7;
  const centerOffset = pageWidth;

  const [cellH, setCellH] = useState(42);

  useEffect(() => {
    if (!props.gridHeightAnim) return;

    let raf = 0;
    const subId = props.gridHeightAnim.addListener(({ value }) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const h = Math.max(0, value);
        const next = Math.max(32, Math.floor(h / WEEKS_IN_GRID));
        setCellH(next);
      });
    });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      props.gridHeightAnim?.removeListener(subId);
    };
  }, [props.gridHeightAnim]);

  const months = useMemo(() => {
    const prev = addMonths(date, -1);
    const cur = date;
    const next = addMonths(date, +1);
    return [prev, cur, next];
  }, [date]);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: centerOffset, animated: false });
    });
  }, [centerOffset, date.getFullYear(), date.getMonth(), pageWidth]);

  const buildMonthGrid = useMemo(() => {
    return (baseDate: Date) => {
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
    };
  }, [weekStartsOn]);

  const pages = useMemo(
    () => months.map(buildMonthGrid),
    [months, buildMonthGrid]
  );

  // ✅ hesap: bars + single-day inline
  const perPageData = useMemo(() => {
    // her sayfa için ayrı map
    return pages.map((p) => {
      const barsByKey: Record<string, DayBar[]> = {};
      const inlineByKey: Record<string, DayInlineItem[]> = {};

      // week row bazında pack
      for (let wi = 0; wi < p.weeks.length; wi++) {
        const weekDays = p.weeks[wi]; // 7 gün
        const weekKeys = weekDays.map(dayKey);

        // bu week içinde görünen multi-day segs topla
        const segs: WeekSeg[] = [];

        // single-day için geçici bucket (gün bazında)
        const inlineTmp: Record<
          string,
          { color: string; title: string; t: number }[]
        > = {};

        for (const ev of props.events) {
          const s = toDate((ev as any).start);
          const e = toDate((ev as any).end);
          if (!Number.isFinite(s.getTime()) || !Number.isFinite(e.getTime()))
            continue;
          if (e <= s) continue;

          const id = String((ev as any).id ?? "");
          const color = (ev as any)?.color ?? colors.primary;
          const rawTitle =
            (ev as any)?.title ?? (ev as any)?.name ?? eventToTitle(ev as any);
          const title = stripLeadingTime(String(rawTitle ?? ""));

          const days = listDaysOverlapped(s, e);
          if (!days.length) continue;

          // bu week içinde görünür günler
          const visibleCols: number[] = [];
          for (let col = 0; col < 7; col++) {
            if (days.some((d) => dayKey(d) === weekKeys[col]))
              visibleCols.push(col);
          }
          if (!visibleCols.length) continue;

          const isSingleDay = days.length === 1;

          if (isSingleDay) {
            // ✅ tek günlük: inline list (dot+title)
            const k = weekKeys[visibleCols[0]];
            (inlineTmp[k] ||= []).push({ color, title, t: s.getTime() });
            continue;
          }

          // ✅ multi-day: bu week için segment
          const startCol = Math.min(...visibleCols);
          const endCol = Math.max(...visibleCols);

          segs.push({ id, color, title, startCol, endCol });
        }

        // pack segs -> row
        const { placement } = packWeekSegments(segs);

        // segleri day keylere dağıt
        for (const seg of segs) {
          const row = placement.get(seg.id) ?? 0;

          // title anchor: segment’in ortası
          const spanLen = seg.endCol - seg.startCol + 1;
          const anchorCol = seg.startCol + Math.floor(spanLen / 2);

          for (let col = seg.startCol; col <= seg.endCol; col++) {
            const k = weekKeys[col];
            const contL = col > seg.startCol;
            const contR = col < seg.endCol;

            (barsByKey[k] ||= []).push({
              id: seg.id,
              color: seg.color,
              contL,
              contR,
              row,
              title: col === anchorCol ? seg.title : null,
            });
          }
        }

        // inline sort & flush
        for (const k of Object.keys(inlineTmp)) {
          inlineTmp[k].sort((a, b) => a.t - b.t);
          inlineByKey[k] = inlineTmp[k].map(({ color, title }) => ({
            color,
            title,
          }));
        }
      }

      return { barsByKey, inlineByKey };
    });
  }, [pages, props.events]);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(x / pageWidth);
    if (pageIndex === 1) return;

    const delta = pageIndex - 1;
    setDate(addMonths(date, delta));

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: centerOffset, animated: false });
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={(r) => {
          scrollRef.current = r;
        }}
        horizontal
        nestedScrollEnabled
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        decelerationRate="fast"
        snapToInterval={pageWidth}
        snapToAlignment="start"
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
        contentContainerStyle={{ width: pageWidth * 3 }}
      >
        {pages.map((p, pi) => {
          const { barsByKey, inlineByKey } = perPageData[pi];

          return (
            <View
              key={`page-${pi}`}
              style={{ width: pageWidth, alignItems: "center" }}
            >
              {p.weeks.map((weekDays, wi) => (
                <View
                  key={`week-${pi}-${wi}`}
                  style={[styles.weekRow, { width: pageWidth }]}
                >
                  {weekDays.map((d, di) => {
                    const k = dayKey(d);

                    return (
                      <DayCard
                        key={`${d.toISOString()}-${pi}-${wi}-${di}`}
                        date={d}
                        width={props.colWidth}
                        height={cellH}
                        expanded={props.expanded}
                        isToday={sameDay(d, today)}
                        isSelected={sameDay(d, selectedDate)}
                        isOutside={d.getMonth() !== p.monthIndex}
                        onPress={(dd) => {
                          setDate(dd);
                          props.onPressDay?.(dd);
                        }}
                        // ✅ multi-day bars (stabil row)
                        bars={barsByKey[k]}
                        maxBars={props.maxMarkers ?? 4}
                        // ✅ single-day inline list (her modda)
                        inlineItems={inlineByKey[k]}
                        maxInlineItems={props.maxInlineItems ?? 2}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
  },
  weekRow: { flexDirection: "row" },
});
