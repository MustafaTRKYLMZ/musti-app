import React, { useMemo } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import type {
  CalendarConfig,
  MEvent,
  WeekViewConfig,
  CalendarView,
} from "../types";
import { WeekView } from "./WeekView";
import { WeekdayLettersRow } from "./components/WeekdayLettersRow";
import { addDays, startOfWeek } from "../engine/helpers";
import { plannerTheme, spacing } from "@musti/ui-native";
import { MonthContainer } from "./MonthContainer";

const { colors } = plannerTheme;

const TIME_COL_WIDTH = 48;
const DAYS_IN_WEEK = 7;

export function MCalendar(props: {
  view: CalendarView;
  date: Date;
  events: MEvent[];
  config?: CalendarConfig;
  locale?: string;
  weekView?: Partial<WeekViewConfig>;
  onPressEvent?: (e: MEvent) => void;
  onPressDay?: (d: Date) => void;
  onCreate?: (day: Date, startMinute?: number) => void;
  onEventChange?: (next: MEvent) => void;
  setDate: (nextDate: Date) => void;
}) {
  const { width } = useWindowDimensions();

  const config: CalendarConfig = {
    locale: "en",
    weekStartsOn: 1,
    ...props.config,
  };

  const leftInset = props.view === "week" ? TIME_COL_WIDTH : 0;

  const daysAreaWidth = Math.max(0, width - leftInset);

  const baseCol = Math.floor(daysAreaWidth / DAYS_IN_WEEK);
  const leftover = daysAreaWidth - baseCol * DAYS_IN_WEEK;

  const gap =
    props.view === "week" ? Math.floor(leftover / (DAYS_IN_WEEK - 1)) : 0;

  const colWidth =
    props.view === "month"
      ? baseCol + Math.floor(leftover / DAYS_IN_WEEK)
      : baseCol;

  const gridWidth =
    props.view === "month"
      ? colWidth * DAYS_IN_WEEK
      : colWidth * DAYS_IN_WEEK + gap * (DAYS_IN_WEEK - 1);

  const weekStart = useMemo(
    () => startOfWeek(props.date, config.weekStartsOn),
    [props.date, config.weekStartsOn]
  );

  const currentWeekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  return (
    <View style={styles.root}>
      <View style={styles.lettersRow}>
        {leftInset > 0 && <View style={{ width: leftInset }} />}
        <View style={[styles.gridBorder, { width: gridWidth }]}>
          <WeekdayLettersRow
            days={currentWeekDays}
            locale={props.locale ?? config.locale}
            colWidth={colWidth}
            gap={gap}
          />
        </View>
      </View>

      {props.view === "week" && (
        <WeekView
          date={props.date}
          events={props.events}
          config={config}
          locale={props.locale ?? config.locale}
          weekView={{
            startHour: 7,
            endHour: 24,
            stepMinutes: 30,
            pxPerMinute: 1.2,
            ...props.weekView,
          }}
          onChangeDate={props.setDate}
          onPressEvent={props.onPressEvent}
          onPressDay={props.onPressDay}
          onCreate={props.onCreate}
          onEventChange={props.onEventChange}
        />
      )}

      {props.view === "month" && (
        <View style={{ flex: 1 }}>
          <MonthContainer
            date={props.date}
            config={config}
            colWidth={colWidth}
            events={props.events}
            locale={props.locale ?? config.locale}
            onChangeDate={props.setDate}
            onPressDay={props.onPressDay}
            onPressEvent={props.onPressEvent}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: spacing["3xl"],
  },
  lettersRow: {
    flexDirection: "row",
    backgroundColor: colors.background,
    height: spacing["3xl"],
  },
  gridBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.textPrimary,
  },
});
