import React, { useEffect, useMemo, useRef } from "react";
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

const DAYS_IN_WEEK = 7;
const WEEKS_WINDOW = 3;
const TOTAL_DAYS = DAYS_IN_WEEK * WEEKS_WINDOW;

const { colors } = plannerTheme;

export function DaysHeader(props: {
  date: Date;
  weekStartsOn: number;
  locale?: string;
  onChangeDate: (nextDate: Date) => void;
  timeColWidth: number;

  selectedDate: Date;
  onPressDay?: (d: Date) => void;
}) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView | null>(null);

  const baseWeekStart = useMemo(
    () => startOfWeek(props.date, props.weekStartsOn),
    [props.date, props.weekStartsOn]
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

  const didInit = useRef(false);
  useEffect(() => {
    didInit.current = false;
  }, [baseWeekStart.getTime(), weekWidthPx]);

  const onLayout = () => {
    if (didInit.current) return;
    didInit.current = true;
    scrollRef.current?.scrollTo({ x: centerOffset, animated: false });
  };

  // ✅ Tap’lerde 1 hafta atlama bug’ını kesin çözen hesap
  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;

    const deltaWeeks = Math.round((x - centerOffset) / weekWidthPx);
    if (deltaWeeks === 0) return;

    props.onChangeDate(addDays(props.date, deltaWeeks * 7));
    scrollRef.current?.scrollTo({ x: centerOffset, animated: false });
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
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
            snapToInterval={weekWidthPx}
            snapToAlignment="start"
            contentContainerStyle={{ width: contentWidth }}
            onMomentumScrollEnd={handleMomentumEnd} // ✅ değişti
          >
            <DayNumbersRow
              days={days}
              today={today}
              colWidth={colWidth}
              gap={gap}
              selectedDate={props.selectedDate}
              onPressDay={props.onPressDay} // ✅ ekli
            />
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.background,
  },
  gridBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.textPrimary,
  },
});
