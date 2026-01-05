// MonthView.tsx (horizontal scroll için onScrollEndDrag yerine onMomentumScrollEnd kullan)
import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import type { CalendarConfig, MEvent } from "../types";
import { addDays, startOfWeek, sameDay } from "../engine/helpers";
import { plannerTheme, spacing } from "@musti/ui-native";
import { Day } from "./components/Day";
import { eventToStartDate } from "../engine/eventToStartDate";

const { colors } = plannerTheme;

const DAYS_IN_WEEK = 7;
const WEEKS_IN_GRID = 6;
const TOTAL_DAYS = DAYS_IN_WEEK * WEEKS_IN_GRID;

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

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

const pad2 = (n: number) => String(n).padStart(2, "0");
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export function MonthView(props: {
  date: Date;
  config: CalendarConfig;
  colWidth: number;
  events: MEvent[];
  onChangeDate: (nextDate: Date) => void;
  onPressDay?: (d: Date) => void;
}) {
  const scrollRef = useRef<ScrollView | null>(null);

  const weekStartsOn = props.config.weekStartsOn ?? 1;
  const today = useMemo(() => new Date(), []);
  const pageWidth = props.colWidth * 7;
  const centerOffset = pageWidth;

  const months = useMemo(() => {
    const prev = addMonths(props.date, -1);
    const cur = props.date;
    const next = addMonths(props.date, +1);
    return [prev, cur, next];
  }, [props.date]);

  const didInit = useRef(false);
  useEffect(() => {
    didInit.current = false;
  }, [props.date.getFullYear(), props.date.getMonth(), pageWidth]);

  const onLayout = () => {
    if (didInit.current) return;
    didInit.current = true;
    scrollRef.current?.scrollTo({ x: centerOffset, animated: false });
  };

  const markersByDayKey = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const ev of props.events) {
      const sd = eventToStartDate(ev as any);
      if (!sd) continue;
      const k = dayKey(sd);
      const c = (ev as any)?.color ?? colors.primary;
      (map[k] ||= []).push(c);
    }
    return map;
  }, [props.events]);

  const monthPages = useMemo(() => {
    return months.map((m) => {
      const monthIndex = m.getMonth();
      const mStart = startOfMonth(m);
      const gridStart = startOfWeek(mStart, weekStartsOn);
      const gridDays = Array.from({ length: TOTAL_DAYS }, (_, i) =>
        addDays(gridStart, i)
      );
      const weeks = Array.from({ length: WEEKS_IN_GRID }, (_, w) =>
        gridDays.slice(w * 7, w * 7 + 7)
      );
      return { monthIndex, weeks };
    });
  }, [months, weekStartsOn]);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(x / pageWidth);
    if (pageIndex === 1) return;

    const delta = pageIndex - 1;
    props.onChangeDate(addMonths(props.date, delta));
    scrollRef.current?.scrollTo({ x: centerOffset, animated: false });
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      <ScrollView
        ref={(r) => {
          scrollRef.current = r;
        }}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        decelerationRate="fast"
        snapToInterval={pageWidth}
        snapToAlignment="start"
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={{ width: pageWidth * 3 }}
      >
        {monthPages.map((mp, mi) => (
          <View
            key={`m-${mi}`}
            style={{ width: pageWidth, alignItems: "center" }}
          >
            {mp.weeks.map((weekDays, wi) => (
              <View key={`w-${mi}-${wi}`} style={styles.weekRow}>
                {weekDays.map((d, di) => {
                  const k = dayKey(d);
                  return (
                    <Day
                      key={`${d.toISOString()}-${mi}-${wi}-${di}`}
                      date={d}
                      width={props.colWidth}
                      height={34 + spacing.xs * 2}
                      isToday={sameDay(d, today)}
                      isSelected={sameDay(d, props.date)}
                      isOutside={d.getMonth() !== mp.monthIndex}
                      markers={markersByDayKey[k]}
                      maxMarkers={2}
                      markerMode="stack"
                      onPress={(dd) => {
                        props.onChangeDate(dd);
                        props.onPressDay?.(dd);
                      }}
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
