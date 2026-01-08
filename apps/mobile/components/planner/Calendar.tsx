import React, { FC, useMemo } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import {
  CalendarConfig,
  MEvent,
  WeekViewConfig,
  addDays,
  startOfWeek,
} from "@musti/planner";
import { WeekView } from "./WeekView";
import { WeekdayLettersRow } from "./WeekdayLettersRow";
import { plannerTheme, spacing } from "@musti/ui-native";
import { MonthContainer } from "./MonthContainer";
import { DAYS_IN_WEEK, TIME_COL_WIDTH } from "@/config/timeConfigs";
import { UpsertEventModal } from "../ui/modals/UpsertEventModal";
import { useCalendar } from "@/hooks/useCalendar";

const { colors } = plannerTheme;

export type CalendarProps = {
  config?: CalendarConfig;
  locale?: string;
  weekView?: Partial<WeekViewConfig>;
  onEventChange?: (next: MEvent) => void;
};

export const Calendar: FC<CalendarProps> = ({
  config: configProp,
  locale,
  weekView,
  onEventChange,
}) => {
  const { width } = useWindowDimensions();

  const {
    view,
    date,

    // create
    createOpen,
    createDay,
    createStartMinute,
    closeCreate,

    editOpen,
    editEventId,
    closeEdit,
    resetModals,

    // events
    events,
    addEvent,
    updateEvent,

    // actions
    pressEvent,
  } = useCalendar();

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

  const editEvent = useMemo(() => {
    if (!editOpen || !editEventId) return null;
    return (events ?? []).find((e) => e.id === editEventId) ?? null;
  }, [events, editOpen, editEventId]);
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
          config={config}
          locale={locale ?? config.locale}
          weekView={{
            startHour: 7,
            endHour: 24,
            stepMinutes: 30,
            pxPerMinute: 1.2,
            ...weekView,
          }}
          onEventChange={onEventChange}
          // Eğer WeekView event press callback’i destekliyorsa:
          // onPressEvent={(e) => pressEvent(e.id, e.start)}
        />
      )}

      {view === "month" && (
        <View style={{ flex: 1 }}>
          <MonthContainer
            config={config}
            colWidth={colWidth}
            locale={locale ?? config.locale}
            onPressEvent={(e) => pressEvent(e.id, e.start)}
          />
        </View>
      )}

      {/* CREATE */}
      <UpsertEventModal
        mode="create"
        visible={createOpen}
        day={createDay}
        startMinute={createStartMinute}
        locale={locale ?? config.locale}
        timezone={config.timezone}
        onClose={closeCreate}
        onSubmit={(payload) => {
          addEvent(payload);
          closeCreate();
        }}
      />

      {/* EDIT (store-driven) */}
      {editEvent ? (
        <UpsertEventModal
          mode="edit"
          visible={editOpen}
          day={new Date(editEvent.start)}
          event={editEvent}
          locale={locale ?? config.locale}
          timezone={config.timezone}
          onClose={resetModals}
          onSubmit={(id, patch) => {
            updateEvent(id, patch);
            resetModals();
          }}
        />
      ) : null}
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
