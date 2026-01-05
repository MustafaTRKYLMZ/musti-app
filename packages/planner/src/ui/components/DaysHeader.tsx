import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import {
  addDays,
  startOfWeek,
  sameDay,
  getWeekdayLetter,
} from "../../engine/helpers";
import {
  plannerTheme,
  radii,
  sizes,
  spacing,
  typography,
} from "@musti/ui-native";

const TIME_COL_WIDTH = 24;
const DAYS_IN_WEEK = 7;

const WEEKS_WINDOW = 3;
const TOTAL_DAYS = DAYS_IN_WEEK * WEEKS_WINDOW;

const { colors } = plannerTheme;

export function DaysHeader(props: {
  date: Date;
  weekStartsOn: number;
  locale?: string; // default en
  onChangeDate: (nextDate: Date) => void;
}) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView | null>(null);

  const baseWeekStart = useMemo(
    () => startOfWeek(props.date, props.weekStartsOn),
    [props.date, props.weekStartsOn]
  );

  const today = useMemo(() => new Date(), []);

  const daysAreaWidth = Math.max(0, width - TIME_COL_WIDTH);

  const baseCol = Math.floor(daysAreaWidth / DAYS_IN_WEEK);
  const leftover = daysAreaWidth - baseCol * DAYS_IN_WEEK;
  const gap = Math.floor(leftover / (DAYS_IN_WEEK - 1));

  const colWidth = baseCol;
  const weekWidthPx = colWidth * DAYS_IN_WEEK + gap * (DAYS_IN_WEEK - 1);

  const contentWidth = weekWidthPx * WEEKS_WINDOW;
  const centerOffset = weekWidthPx;

  const days = useMemo(() => {
    const start = addDays(baseWeekStart, -DAYS_IN_WEEK);
    return Array.from({ length: TOTAL_DAYS }).map((_, i) => addDays(start, i));
  }, [baseWeekStart]);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: centerOffset, animated: false });
    });
  }, [centerOffset, baseWeekStart]);

  const handleEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;

    const weekIndex = Math.round(x / weekWidthPx);
    if (weekIndex === 1) return;

    const deltaWeeks = weekIndex - 1; // -1 or +1
    props.onChangeDate(addDays(props.date, deltaWeeks * 7));

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: centerOffset, animated: false });
    });
  };

  return (
    <View style={styles.container}>
      <View style={{ width: TIME_COL_WIDTH }} />

      <ScrollView
        ref={(r) => {
          scrollRef.current = r;
        }}
        style={{ width: weekWidthPx }}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        decelerationRate="fast"
        snapToInterval={weekWidthPx}
        snapToAlignment="start"
        contentContainerStyle={[styles.scrollContent, { width: contentWidth }]}
        onScrollEndDrag={handleEndDrag}
      >
        {days.map((d, i) => {
          const isToday = sameDay(d, today);
          const isLastInWeek = i % 7 === 6;

          return (
            <View
              key={`${d.toISOString()}-${i}`}
              style={[
                styles.day,
                {
                  width: colWidth,
                  marginRight: isLastInWeek ? 0 : gap,
                },
              ]}
            >
              <View style={[styles.pill, isToday && styles.pillToday]}>
                <Text style={[styles.dayName, isToday && styles.todayText]}>
                  {getWeekdayLetter(d, props.locale)}
                </Text>

                <Text style={[styles.dayNumber, isToday && styles.todayText]}>
                  {d.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexDirection: "row",
  },

  day: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xs, // ✅ sm -> xs
  },

  pill: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 1,
    paddingHorizontal: 4,
    borderRadius: radii.md,
    minWidth: 30, // ✅ 34 -> 30
    minHeight: 30, // ✅ 34 -> 30
  },

  pillToday: {
    backgroundColor: colors.backgroundSecondary,
  },

  dayName: {
    fontSize: sizes.sm, // ✅ md -> sm
    fontWeight: "600",
    letterSpacing: 0.4, // ✅ 0.5 -> 0.4
    color: colors.textPrimary,
  },

  dayNumber: {
    fontSize: typography.heading4.fontSize,
    fontWeight: typography.heading4.fontWeight,
    color: colors.textPrimary,
  },

  todayText: { color: colors.primary },
});
