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

const buildVisibleDayKeySet = (baseDate: Date, weekStartsOn: number) => {
  const monthStart = startOfMonth(baseDate);
  const gridStart = startOfWeek(monthStart, weekStartsOn);
  const gridDays = Array.from({ length: TOTAL_DAYS }, (_, i) =>
    addDays(gridStart, i)
  );
  const set = new Set<string>();
  for (const d of gridDays) set.add(dayKey(d));
  return set;
};

export function MonthView(props: {
  config: CalendarConfig;
  colWidth: number;
  events: MEvent[];
  expanded: boolean;
  locale?: string;
  gridHeightAnim?: Animated.Value;
  onPressDay?: (d: Date) => void;
  maxMarkers?: number;
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

  const { barsByDayKey, inlineByDayKey } = useMemo(() => {
    const bars: Record<string, DayBar[]> = {};
    const inline: Record<
      string,
      { color: string; title: string; t: number }[]
    > = {};

    const visibleSets = months.map((m) =>
      buildVisibleDayKeySet(m, weekStartsOn)
    );

    for (const ev of props.events) {
      const s = toDate((ev as any).start);
      const e = toDate((ev as any).end);
      if (!Number.isFinite(s.getTime()) || !Number.isFinite(e.getTime()))
        continue;
      if (e <= s) continue;

      const eventId = String((ev as any).id ?? "");
      const color = (ev as any)?.color ?? colors.primary;

      const rawTitle =
        (ev as any)?.title ?? (ev as any)?.name ?? eventToTitle(ev as any);
      const title = stripLeadingTime(String(rawTitle ?? ""));

      const days = listDaysOverlapped(s, e);
      if (!days.length) continue;

      for (let pageIndex = 0; pageIndex < 3; pageIndex++) {
        const visible = visibleSets[pageIndex];
        const visibleDays = days.filter((d) => visible.has(dayKey(d)));

        if (!visibleDays.length) continue;

        const anchorIdx = Math.floor(visibleDays.length / 2);
        const anchorKey = dayKey(visibleDays[anchorIdx]);

        for (let i = 0; i < visibleDays.length; i++) {
          const d = visibleDays[i];
          const k = dayKey(d);

          const contL = i > 0;
          const contR = i < visibleDays.length - 1;

          (bars[k] ||= []).push({
            id: eventId,
            color,
            contL,
            contR,
            title: k === anchorKey ? title : null,
          });
        }
      }

      const startKey = dayKey(startOfDayLocal(s));
      (inline[startKey] ||= []).push({ color, title, t: s.getTime() });
    }

    // inline sort
    for (const k of Object.keys(inline)) inline[k].sort((a, b) => a.t - b.t);
    const inlineFlat: Record<string, DayInlineItem[]> = {};
    for (const k of Object.keys(inline)) {
      inlineFlat[k] = inline[k].map(({ color, title }) => ({ color, title }));
    }

    return { barsByDayKey: bars, inlineByDayKey: inlineFlat };
  }, [props.events, months, weekStartsOn]);

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
        {pages.map((p, pi) => (
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
                      bars={barsByDayKey[k]}
                      maxBars={props.maxMarkers ?? 4}
                      inlineItems={
                        props.expanded ? inlineByDayKey[k] : undefined
                      }
                      maxInlineItems={props.maxInlineItems ?? 2}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        ))}
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
