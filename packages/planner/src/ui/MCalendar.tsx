import React, { useMemo } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import type {
  CalendarConfig,
  MEvent,
  WeekViewConfig,
  CalendarView,
} from "../types";
import { WeekView } from "./WeekView";
import { MonthView } from "./MonthView";
import { WeekdayLettersRow } from "./components/WeekdayLettersRow";
import { addDays, startOfWeek } from "../engine/helpers";
import { plannerTheme, spacing } from "@musti/ui-native";

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

  const daysWidth = Math.max(0, width - leftInset);
  const colWidth = Math.floor(daysWidth / DAYS_IN_WEEK);
  const gridWidth = colWidth * DAYS_IN_WEEK;

  const weekStart = useMemo(
    () => startOfWeek(props.date, config.weekStartsOn),
    [props.date, config.weekStartsOn]
  );

  const currentWeekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.lettersRow}>
        {leftInset > 0 && <View style={{ width: leftInset }} />}
        <View style={[styles.gridBorder, { width: gridWidth }]}>
          <WeekdayLettersRow
            days={currentWeekDays}
            locale={props.locale ?? config.locale}
            colWidth={colWidth}
            gap={0}
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
        <>
          <MonthView
            date={props.date}
            config={config}
            colWidth={colWidth}
            onChangeDate={props.setDate}
            onPressDay={props.onPressDay}
          />

          {/* 🔹 Month bottom separator */}
          <View style={styles.monthBottomRow}>
            <View style={{ width: leftInset }} />
            <View style={[styles.monthBottomBorder, { width: gridWidth }]} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  lettersRow: {
    flexDirection: "row",
    backgroundColor: colors.background,
    height: spacing["3xl"],
  },

  gridBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.textPrimary,
  },

  monthBottomRow: {
    flexDirection: "row",
    backgroundColor: colors.background,
  },

  monthBottomBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.textPrimary,
  },
});
