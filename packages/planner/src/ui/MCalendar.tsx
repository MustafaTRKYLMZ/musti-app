// MCalendar.tsx
import React, { FC, useMemo } from "react";
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
import { MText, plannerTheme, spacing, typography } from "@musti/ui-native";
import { MonthDayEventsList } from "./components/MonthDayEventsList";
import { DAYS_IN_WEEK, TIME_COL_WIDTH } from "../config/timeConfigs";

const { colors } = plannerTheme;

export type MCalendarProps = {
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
};
export const MCalendar: FC<MCalendarProps> = ({
  view,
  date,
  events,
  config,
  locale,
  weekView,
  onPressEvent,
  onPressDay,
  onCreate,
  onEventChange,
  setDate,
}) => {
  const { width } = useWindowDimensions();

  const resolvedConfig: CalendarConfig = {
    locale: "en",
    weekStartsOn: 1,
    ...config,
  };

  const leftInset = view === "week" ? TIME_COL_WIDTH : 0;

  const daysWidth = Math.max(0, width - leftInset);
  const colWidth = Math.floor(daysWidth / DAYS_IN_WEEK);
  const gridWidth = colWidth * DAYS_IN_WEEK;

  const weekStart = useMemo(
    () => startOfWeek(date, resolvedConfig.weekStartsOn),
    [date, resolvedConfig.weekStartsOn]
  );

  const currentWeekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const day = date.getDate();
  const month = date.toLocaleDateString(locale ?? config.locale, {
    month: "short",
  });
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.lettersRow}>
        {leftInset > 0 && <View style={{ width: leftInset }} />}
        <View style={[styles.gridBorder, { width: gridWidth }]}>
          <WeekdayLettersRow
            days={currentWeekDays}
            locale={locale ?? resolvedConfig.locale}
            colWidth={colWidth}
            gap={0}
          />
        </View>
      </View>

      {view === "week" && (
        <WeekView
          date={date}
          events={events}
          config={resolvedConfig}
          locale={locale ?? config.locale}
          weekView={{
            startHour: 7,
            endHour: 24,
            stepMinutes: 30,
            pxPerMinute: 1.2,
            ...weekView,
          }}
          onChangeDate={setDate}
          onPressEvent={onPressEvent}
          onPressDay={onPressDay}
          onCreate={onCreate}
          onEventChange={onEventChange}
        />
      )}

      {view === "month" && (
        <>
          <MonthView
            date={date}
            config={config}
            colWidth={colWidth}
            events={events}
            onChangeDate={setDate}
            onPressDay={onPressDay}
          />

          <View style={styles.monthBottomRow}>
            <View style={{ width: leftInset }} />
            <View style={[styles.monthBottomBorder, { width: gridWidth }]} />
          </View>

          <View style={styles.agendaWrap}>
            <MText style={styles.agendaTitle}>{`${day} ${month}`}</MText>

            <MonthDayEventsList
              date={date}
              events={events}
              onPressEvent={onPressEvent}
            />
          </View>
        </>
      )}
    </View>
  );
};

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
  agendaWrap: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
  },
  agendaTitle: {
    fontSize: typography.heading4.fontSize,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  agendaScroll: {
    flex: 1,
  },
  agendaContent: {
    paddingBottom: spacing.lg,
  },
  agendaEmpty: {
    paddingVertical: spacing.md,
  },
  agendaEmptyText: {
    color: colors.textSecondary ?? colors.textPrimary,
    opacity: 0.7,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  eventTime: {
    width: 56,
    color: colors.textSecondary ?? colors.textPrimary,
    opacity: 0.85,
  },
  eventTitle: {
    flex: 1,
    color: colors.textPrimary,
  },
});
