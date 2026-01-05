// MonthView.tsx
import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import type { CalendarConfig } from "../types";
import { addDays, startOfWeek } from "../engine/helpers";
import { plannerTheme, spacing } from "@musti/ui-native";
import { Day } from "./components/Day";
import { sameDay } from "../engine/helpers";

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

export function MonthView(props: {
  date: Date;
  config: CalendarConfig;
  colWidth: number;
  onChangeDate: (nextDate: Date) => void;
  onPressDay?: (d: Date) => void;
}) {
  const scrollRef = useRef<ScrollView | null>(null);

  const weekStartsOn = props.config.weekStartsOn ?? 1;
  const today = useMemo(() => new Date(), []);

  const pageWidth = props.colWidth * 7;
  const PAGES = 3;
  const centerOffset = pageWidth;
  const contentWidth = pageWidth * PAGES;

  const months = useMemo(() => {
    const prev = addMonths(props.date, -1);
    const cur = props.date;
    const next = addMonths(props.date, +1);
    return [prev, cur, next];
  }, [props.date]);

  const monthGrids = useMemo(() => {
    return months.map((m) => {
      const mStart = startOfMonth(m);
      const gridStart = startOfWeek(mStart, weekStartsOn);
      const gridDays = Array.from({ length: TOTAL_DAYS }, (_, i) =>
        addDays(gridStart, i)
      );
      const monthIndex = m.getMonth();
      const weeks = Array.from({ length: WEEKS_IN_GRID }, (_, w) =>
        gridDays.slice(w * 7, w * 7 + 7)
      );
      return { monthIndex, weeks };
    });
  }, [months, weekStartsOn]);

  const didInit = useRef(false);
  useEffect(() => {
    didInit.current = false;
  }, [props.date.getFullYear(), props.date.getMonth(), pageWidth]);

  const onLayout = () => {
    if (didInit.current) return;
    didInit.current = true;
    scrollRef.current?.scrollTo({ x: centerOffset, animated: false });
  };

  const handleEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
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
        contentContainerStyle={{ width: contentWidth }}
        onScrollEndDrag={handleEndDrag}
      >
        {monthGrids.map((mg, mi) => (
          <View key={`m-${mi}`} style={{ width: pageWidth }}>
            {mg.weeks.map((weekDays, wi) => (
              <View key={`w-${mi}-${wi}`} style={styles.weekRow}>
                {weekDays.map((d, di) => (
                  <Day
                    key={`${d.toISOString()}-${mi}-${wi}-${di}`}
                    date={d}
                    width={props.colWidth}
                    height={34 + spacing.xs * 2}
                    isToday={sameDay(d, today)}
                    isSelected={sameDay(d, props.date)}
                    isOutside={d.getMonth() !== mg.monthIndex}
                    onPress={(dd) => {
                      props.onChangeDate(dd);
                      props.onPressDay?.(dd);
                    }}
                  />
                ))}
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
    width: "100%",
  },
});
