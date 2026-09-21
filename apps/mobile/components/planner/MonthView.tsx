import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { DayCard } from "./DayCard";
import { WEEKS_IN_GRID } from "@/config/timeConfigs";
import { sameDay, toISODateKeyLocal } from "@musti/planner";
import { useCalendarUiStore } from "@/store/calendar/useCalendarUiStore";
import {
  addMonthsClamped,
} from "@/utils/calendar/monthViewUtils";
import {
  buildDayEventIndex,
  getDayEventMarkers,
} from "@/utils/calendar/dayEventIndex";
import {
  getMonthPageData,
  prefetchAdjacentMonths,
} from "@/utils/calendar/monthPageData";
import { getWeekdayHeaderDays } from "@/utils/calendar/format";
import { WeekdayLettersRow } from "./WeekdayLettersRow";

const { colors } = plannerTheme;

const SWIPE_COMMIT_RATIO = 0.08;
const FLING_VELOCITY = 0.08;

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
  const commitLockUntil = useRef(0);
  const dateRef = useRef(useCalendarUiStore.getState().date);
  const isDraggingRef = useRef(false);

  const date = useCalendarUiStore((s) => s.date);
  const selectedDate = useCalendarUiStore((s) => s.selectedDate);
  const shiftDate = useCalendarUiStore((s) => s.shiftDate);
  const setDate = useCalendarUiStore((s) => s.setDate);

  const weekStartsOn = props.config.weekStartsOn ?? 1;
  const today = useMemo(() => new Date(), []);

  const pageWidth = props.colWidth * 7;
  const centerOffset = pageWidth;

  const [cellH, setCellH] = useState(42);

  useEffect(() => {
    dateRef.current = date;
  }, [date]);

  useEffect(() => {
    prefetchAdjacentMonths(date, props.events, weekStartsOn);
  }, [date, props.events, weekStartsOn]);

  useEffect(() => {
    if (!props.gridHeightAnim) return;

    let lastCellH = 0;
    const subId = props.gridHeightAnim.addListener(({ value }) => {
      const h = Math.max(0, value);
      const next = Math.max(32, Math.floor(h / WEEKS_IN_GRID));
      if (Math.abs(next - lastCellH) < 3) return;
      lastCellH = next;
      setCellH(next);
    });

    return () => {
      props.gridHeightAnim?.removeListener(subId);
    };
  }, [props.gridHeightAnim]);

  const dayIndex = useMemo(
    () => buildDayEventIndex(props.events),
    [props.events]
  );

  const months = useMemo(
    () => [addMonthsClamped(date, -1), date, addMonthsClamped(date, +1)],
    [date]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ x: centerOffset, animated: false });
  }, [date.getFullYear(), date.getMonth(), pageWidth, centerOffset]);

  const pages = useMemo(
    () =>
      months.map((m) => getMonthPageData(m, props.events, weekStartsOn)),
    [months, props.events, weekStartsOn]
  );

  const weekdayHeaderDays = useMemo(
    () => getWeekdayHeaderDays(weekStartsOn),
    [weekStartsOn]
  );

  const commitPage = useCallback(
    (x: number, velocityX = 0) => {
      if (Date.now() < commitLockUntil.current) return false;

      const dist = x - centerOffset;
      let pageIndex = 1;

      if (Math.abs(velocityX) > FLING_VELOCITY) {
        pageIndex = velocityX < 0 ? 2 : 0;
      } else if (Math.abs(dist) > pageWidth * SWIPE_COMMIT_RATIO) {
        pageIndex = dist > 0 ? 2 : 0;
      } else {
        pageIndex = Math.round(x / pageWidth);
        if (pageIndex === 1) return false;
      }

      if (pageIndex === 1) return false;

      commitLockUntil.current = Date.now() + 280;
      const delta = pageIndex - 1;
      const nextDate = addMonthsClamped(dateRef.current, delta);

      scrollRef.current?.scrollTo({ x: centerOffset, animated: false });
      shiftDate(nextDate);
      return true;
    },
    [pageWidth, centerOffset, shiftDate]
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isDraggingRef.current) return;
      commitPage(e.nativeEvent.contentOffset.x);
    },
    [commitPage]
  );

  const handleScrollRelease = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      isDraggingRef.current = false;
      const { contentOffset, velocity } = e.nativeEvent;
      commitPage(contentOffset.x, velocity?.x ?? 0);
    },
    [commitPage]
  );

  return (
    <View style={styles.container}>
      <WeekdayLettersRow
        days={weekdayHeaderDays}
        locale={props.locale ?? props.config.locale}
        weekStartsOn={weekStartsOn}
        colWidth={props.colWidth}
        gap={0}
        containerStyle={styles.weekdayRow}
      />

      <ScrollView
        ref={(r) => {
          scrollRef.current = r;
        }}
        horizontal
        nestedScrollEnabled
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        removeClippedSubviews
        bounces={false}
        decelerationRate="fast"
        disableIntervalMomentum
        pagingEnabled
        onScrollBeginDrag={() => {
          isDraggingRef.current = true;
        }}
        onScroll={handleScroll}
        onScrollEndDrag={handleScrollRelease}
        scrollEventThrottle={16}
        contentContainerStyle={{ width: pageWidth * 3 }}
      >
        {pages.map((p, pi) => {
          return (
            <View
              key={`${months[pi].getFullYear()}-${months[pi].getMonth()}`}
              style={{ width: pageWidth, alignItems: "center" }}
            >
              {p.weeks.map((weekDays, wi) => (
                <View
                  key={`week-${pi}-${wi}`}
                  style={[styles.weekRow, { width: pageWidth }]}
                >
                  {weekDays.map((d, di) => {
                    const k = toISODateKeyLocal(d);

                    return (
                      <DayCard
                        key={`${k}-${pi}-${wi}-${di}`}
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
                        bars={p.barsByKey[k]}
                        maxBars={props.maxMarkers ?? 4}
                        inlineItems={p.inlineByKey[k]}
                        maxInlineItems={props.maxInlineItems ?? 4}
                        markers={getDayEventMarkers(dayIndex, d).map((m) => ({
                          id: m.id,
                          color: m.color,
                        }))}
                        maxMarkerDots={4}
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
    paddingBottom: spacing.sm,
  },
  weekdayRow: {
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    marginBottom: spacing.xs,
  },
  weekRow: { flexDirection: "row" },
});
