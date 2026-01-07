import React, { FC, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import {
  CalendarConfig,
  MEvent,
  WeekViewConfig,
  CalendarView,
  addDays,
  startOfWeek,
} from "@musti/planner";
import { WeekView } from "./WeekView";
import { WeekdayLettersRow } from "./WeekdayLettersRow";
import { plannerTheme, spacing } from "@musti/ui-native";
import { MonthContainer } from "./MonthContainer";
import { DAYS_IN_WEEK, TIME_COL_WIDTH } from "@/config/timeConfigs";
import { EventCreateModal } from "../ui/modals/EventCreateModal";
import { useCalendarEventsStore } from "@/store/calendar/useCalendarEventsStore";

const { colors } = plannerTheme;

export type MCalendarProps = {
  view: CalendarView;
  date: Date;
  config?: CalendarConfig;
  locale?: string;
  weekView?: Partial<WeekViewConfig>;
  onPressEvent?: (e: MEvent) => void;
  onPressDay?: (d: Date) => void;
  onCreate?: (day: Date, startMinute?: number) => void;
  onEventChange?: (next: MEvent) => void;
  setDate: (nextDate: Date) => void;

  openCreateToken?: number;
  openCreateDay?: Date;
};

export const MCalendar: FC<MCalendarProps> = ({
  view,
  date,
  config: configProp,
  locale,
  weekView,
  onPressEvent,
  onPressDay,
  onCreate,
  onEventChange,
  setDate,
  openCreateToken,
  openCreateDay,
}) => {
  const { width } = useWindowDimensions();

  const addEvent = useCalendarEventsStore((s) => s.addEvent);
  const events = useCalendarEventsStore((s) => s.events);

  const [createOpen, setCreateOpen] = useState(false);
  const [createDay, setCreateDay] = useState<Date>(new Date());
  const [createStartMinute, setCreateStartMinute] = useState<
    number | undefined
  >(undefined);

  const config: CalendarConfig = {
    locale: "en",
    weekStartsOn: 1,
    ...configProp,
  };

  const leftInset = view === "week" ? TIME_COL_WIDTH : 0;
  const daysAreaWidth = Math.max(0, width - leftInset);

  const baseCol = Math.floor(daysAreaWidth / DAYS_IN_WEEK);
  const leftover = daysAreaWidth - baseCol * DAYS_IN_WEEK;

  const gap = view === "week" ? Math.floor(leftover / (DAYS_IN_WEEK - 1)) : 0;

  const colWidth =
    view === "month" ? baseCol + Math.floor(leftover / DAYS_IN_WEEK) : baseCol;

  const gridWidth =
    view === "month"
      ? colWidth * DAYS_IN_WEEK
      : colWidth * DAYS_IN_WEEK + gap * (DAYS_IN_WEEK - 1);

  const weekStart = useMemo(
    () => startOfWeek(date, config.weekStartsOn ?? 0),
    [date, config.weekStartsOn]
  );

  const currentWeekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // ✅ dışarıdan token gelince modal aç
  useEffect(() => {
    if (openCreateToken == null) return;
    const d = openCreateDay ?? date;

    setCreateDay(d);
    setCreateStartMinute(undefined);
    setCreateOpen(true);
  }, [openCreateToken]);

  return (
    <View style={styles.root}>
      <View style={styles.lettersRow}>
        {leftInset > 0 && <View style={{ width: leftInset }} />}
        <View style={[styles.gridBorder, { width: gridWidth }]}>
          <WeekdayLettersRow
            days={currentWeekDays}
            locale={locale ?? config.locale}
            colWidth={colWidth}
            gap={gap}
          />
        </View>
      </View>

      {view === "week" && (
        <WeekView
          date={date}
          events={events}
          config={config}
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
          onCreate={(day, startMinute) => {
            onCreate?.(day, startMinute);
            setCreateDay(day);
            setCreateStartMinute(startMinute);
            setCreateOpen(true);
          }}
          onEventChange={onEventChange}
        />
      )}

      {view === "month" && (
        <View style={{ flex: 1 }}>
          <MonthContainer
            date={date}
            config={config}
            colWidth={colWidth}
            events={events}
            locale={locale ?? config.locale}
            onChangeDate={setDate}
            onPressDay={(d) => {
              onPressDay?.(d);
              setCreateDay(d);
              setCreateStartMinute(undefined);
            }}
            onPressEvent={onPressEvent}
          />
        </View>
      )}

      <EventCreateModal
        visible={createOpen}
        day={createDay}
        startMinute={createStartMinute}
        locale={locale ?? config.locale}
        timezone={config.timezone}
        onClose={() => setCreateOpen(false)}
        onSubmit={(payload) => {
          addEvent(payload);
          setCreateOpen(false);
        }}
      />
    </View>
  );
};

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
