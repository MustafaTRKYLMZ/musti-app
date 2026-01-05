// MonthView.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
} from "react-native";
import type { CalendarConfig, MEvent } from "../types";
import { addDays, startOfWeek, sameDay } from "../engine/helpers";
import { plannerTheme, spacing } from "@musti/ui-native";
import { DayCard, DayInlineItem } from "./components/DayCard";
import { eventToStartDate } from "../engine/eventToStartDate";
import { eventToTitle } from "../engine";

const { colors } = plannerTheme;

const DAYS_IN_WEEK = 7;
const WEEKS_IN_GRID = 6;
const TOTAL_DAYS = DAYS_IN_WEEK * WEEKS_IN_GRID;

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

export function MonthView(props: {
  date: Date;
  config: CalendarConfig;
  colWidth: number;
  events: MEvent[];
  expanded: boolean;
  gridHeightAnim?: Animated.Value;
  onChangeDate: (nextDate: Date) => void;
  onPressDay?: (d: Date) => void;
  maxMarkers?: number;
  maxInlineItems?: number;
}) {
  const scrollRef = useRef<ScrollView | null>(null);

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
    const prev = addMonths(props.date, -1);
    const cur = props.date;
    const next = addMonths(props.date, +1);
    return [prev, cur, next];
  }, [props.date]);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: centerOffset, animated: false });
    });
  }, [
    centerOffset,
    props.date.getFullYear(),
    props.date.getMonth(),
    pageWidth,
  ]);

  const { markersByDayKey, inlineByDayKey } = useMemo(() => {
    const markers: Record<string, string[]> = {};
    const inline: Record<
      string,
      { color: string; title: string; t: number }[]
    > = {};

    for (const ev of props.events) {
      const sd = eventToStartDate(ev as any);
      if (!sd) continue;

      const k = dayKey(sd);
      const c = (ev as any)?.color ?? colors.primary;

      (markers[k] ||= []).push(c);

      const rawTitle =
        (ev as any)?.title ?? (ev as any)?.name ?? eventToTitle(ev as any);
      const label = stripLeadingTime(String(rawTitle ?? ""));

      (inline[k] ||= []).push({ color: c, title: label, t: sd.getTime() });
    }

    for (const k of Object.keys(inline)) inline[k].sort((a, b) => a.t - b.t);

    const inlineFlat: Record<string, DayInlineItem[]> = {};
    for (const k of Object.keys(inline)) {
      inlineFlat[k] = inline[k].map(({ color, title }) => ({ color, title }));
    }

    return { markersByDayKey: markers, inlineByDayKey: inlineFlat };
  }, [props.events]);

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
    props.onChangeDate(addMonths(props.date, delta));

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
                      isToday={sameDay(d, today)}
                      isSelected={sameDay(d, props.date)}
                      isOutside={d.getMonth() !== p.monthIndex}
                      onPress={(dd) => {
                        props.onChangeDate(dd);
                        props.onPressDay?.(dd);
                      }}
                      markers={props.expanded ? undefined : markersByDayKey[k]}
                      maxMarkers={props.maxMarkers ?? 4}
                      markerMode="stack"
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
  weekRow: {
    flexDirection: "row",
  },
});
