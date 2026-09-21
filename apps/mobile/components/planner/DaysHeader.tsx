import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { plannerTheme } from "@musti/ui-native";
import { DayNumbersRow } from "./DayNumbersRow";
import { startOfWeek, addDays } from "@musti/planner";
import { useCalendar } from "@/hooks/useCalendar";

const DAYS_IN_WEEK = 7;
const WEEKS_WINDOW = 3;
const TOTAL_DAYS = DAYS_IN_WEEK * WEEKS_WINDOW;

const SWIPE_COMMIT_RATIO = 0.08;
const FLING_VELOCITY = 0.08;

const { colors } = plannerTheme;

export function DaysHeader(props: {
  weekStartsOn: number;
  locale?: string;
  onChangeDate: (nextDate: Date) => void;
  timeColWidth: number;
}) {
  const { date } = useCalendar();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView | null>(null);
  const commitLockUntil = useRef(0);
  const dateRef = useRef(date);
  const isDraggingRef = useRef(false);

  const baseWeekStart = useMemo(
    () => startOfWeek(date, props.weekStartsOn),
    [date, props.weekStartsOn]
  );

  const today = useMemo(() => new Date(), []);

  const daysAreaWidth = Math.max(0, width - props.timeColWidth);

  const baseCol = Math.floor(daysAreaWidth / DAYS_IN_WEEK);
  const leftover = daysAreaWidth - baseCol * DAYS_IN_WEEK;
  const gap = Math.floor(leftover / (DAYS_IN_WEEK - 1));
  const colWidth = baseCol;

  const weekWidthPx = colWidth * DAYS_IN_WEEK + gap * (DAYS_IN_WEEK - 1);
  const contentWidth = weekWidthPx * WEEKS_WINDOW;
  const centerOffset = weekWidthPx;

  const days = useMemo(() => {
    const start = addDays(baseWeekStart, -DAYS_IN_WEEK);
    return Array.from({ length: TOTAL_DAYS }, (_, i) => addDays(start, i));
  }, [baseWeekStart]);

  useEffect(() => {
    dateRef.current = date;
  }, [date]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ x: centerOffset, animated: false });
  }, [baseWeekStart.getTime(), weekWidthPx, centerOffset]);

  const { onChangeDate } = props;

  const commitWeek = useCallback(
    (x: number, velocityX = 0) => {
      if (Date.now() < commitLockUntil.current) return false;

      const dist = x - centerOffset;
      let weekIndex = 1;

      if (Math.abs(velocityX) > FLING_VELOCITY) {
        weekIndex = velocityX < 0 ? 2 : 0;
      } else if (Math.abs(dist) > weekWidthPx * SWIPE_COMMIT_RATIO) {
        weekIndex = dist > 0 ? 2 : 0;
      } else {
        weekIndex = Math.round(x / weekWidthPx);
        if (weekIndex === 1) return false;
      }

      if (weekIndex === 1) return false;

      commitLockUntil.current = Date.now() + 280;
      onChangeDate(addDays(dateRef.current, (weekIndex - 1) * 7));
      scrollRef.current?.scrollTo({ x: centerOffset, animated: false });
      return true;
    },
    [weekWidthPx, centerOffset, onChangeDate]
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isDraggingRef.current) return;
      commitWeek(e.nativeEvent.contentOffset.x);
    },
    [commitWeek]
  );

  const handleScrollRelease = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      isDraggingRef.current = false;
      const { contentOffset, velocity } = e.nativeEvent;
      commitWeek(contentOffset.x, velocity?.x ?? 0);
    },
    [commitWeek]
  );

  return (
    <View style={styles.container}>
      <View style={{ width: props.timeColWidth }} />
      <View style={{ width: weekWidthPx }}>
        <View style={styles.gridBorder}>
          <ScrollView
            ref={(r) => {
              scrollRef.current = r;
            }}
            horizontal
            showsHorizontalScrollIndicator={false}
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
            contentContainerStyle={{ width: contentWidth }}
          >
            <DayNumbersRow
              days={days}
              today={today}
              colWidth={colWidth}
              gap={gap}
            />
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", backgroundColor: colors.background },
  gridBorder: { borderBottomWidth: 1, borderBottomColor: colors.textPrimary },
});
