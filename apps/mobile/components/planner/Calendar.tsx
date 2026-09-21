import React, { FC, useCallback, useMemo } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import {
  CalendarConfig,
  isGoogleEvent,
  MEvent,
  WeekViewConfig,
  addDays,
  startOfWeek,
} from "@musti/planner";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/services/googleCalendar/calendarEventMutations";
import { WeekView } from "./WeekView";
import { WeekdayLettersRow } from "./WeekdayLettersRow";
import { plannerTheme, spacing } from "@musti/ui-native";
import { MonthContainer } from "./MonthContainer";
import { DayViewModal } from "./DayViewModal";
import { DayView } from "./DayView";
import { DAYS_IN_WEEK, TIME_COL_WIDTH } from "@/config/timeConfigs";
import { UpsertEventModal } from "../ui/modals/UpsertEventModal";
import { useCalendar } from "@/hooks/useCalendar";

import { useCalendarEventsStore } from "@/store/calendar/useCalendarEventsStore";
import { useToast } from "../ui/ToastProvider";
import { useTranslation } from "@musti/core";

const { colors } = plannerTheme;

export type CalendarProps = {
  config?: CalendarConfig;
  locale?: string;
  weekView?: Partial<WeekViewConfig>;
  onEventChange?: (next: MEvent) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
};

export const Calendar: FC<CalendarProps> = ({
  config: configProp,
  locale,
  weekView,
  onEventChange,
  onRefresh,
  refreshing,
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

    // edit
    editOpen,
    editEventId,
    closeEdit,

    // events
    events,

    // actions
    pressEvent,

    dayModalOpen,
    dayModalDate,
    closeDayModal,
  } = useCalendar();

  const { showToast, hideToast } = useToast();
  const { t } = useTranslation();

  const deleteEventWithUndo = useCalendarEventsStore(
    (s) => s.deleteEventWithUndo
  );
  const undoDelete = useCalendarEventsStore((s) => s.undoDelete);

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

  const showMutationError = useCallback(
    (message: string) => {
      showToast({
        title: t("planner.event.updateFailed"),
        message,
        variant: "danger",
        duration: 6000,
      });
    },
    [showToast, t]
  );

  const confirmDeleteToast = useCallback(
    (event: MEvent) => {
      const isGoogle = isGoogleEvent(event);
      showToast(
        {
          title: t("planner.event.deleteTitle"),
          message: isGoogle
            ? t("planner.event.deleteGoogle")
            : t("planner.event.deleteUndo"),
          variant: "danger",
          duration: 6000,
          actions: [
            {
              label: t("cancel"),
              onPress: () => hideToast(),
            },
            {
              label: t("delete"),
              destructive: true,
              onPress: () => {
                hideToast();

                if (isGoogle) {
                  void deleteCalendarEvent(event)
                    .then(() => {
                      showToast({
                        message: t("planner.event.deleted"),
                        variant: "success",
                        duration: 3000,
                      });
                    })
                    .catch((err) => {
                      showMutationError(
                        err instanceof Error
                          ? err.message
                          : t("planner.event.deleteFailed")
                      );
                    });
                  return;
                }

                deleteEventWithUndo(event.id, 4000);
                showToast(
                  {
                    message: t("planner.event.deleted"),
                    variant: "danger",
                    duration: 4000,
                    actions: [
                      {
                        label: t("planner.event.undo"),
                        onPress: () => undoDelete(),
                      },
                    ],
                  },
                  4000
                );
              },
            },
          ],
        },
        6000
      );
    },
    [showToast, hideToast, deleteEventWithUndo, undoDelete, showMutationError, t]
  );

  return (
    <View style={styles.root}>
      {view === "week" ? (
        <View style={styles.lettersRow}>
          {leftInset > 0 && <View style={{ width: leftInset }} />}
          <View style={[styles.gridBorder, { width: gridWidth }]}>
            <WeekdayLettersRow
              days={currentWeekDays}
              locale={locale ?? config.locale}
              weekStartsOn={config.weekStartsOn ?? 1}
              colWidth={colWidth}
              gap={gap}
            />
          </View>
        </View>
      ) : null}

      {view === "day" && (
        <DayView
          day={date}
          config={config}
          locale={locale ?? config.locale}
          weekView={{
            startHour: 0,
            endHour: 24,
            stepMinutes: 15,
            pxPerMinute: 1.2,
            ...weekView,
          }}
          onEventChange={onEventChange}
        />
      )}

      {view === "week" && (
        <WeekView
          config={config}
          locale={locale ?? config.locale}
          weekView={{
            startHour: 0,
            endHour: 24,
            stepMinutes: 15,
            pxPerMinute: 1.2,
            ...weekView,
          }}
          onEventChange={onEventChange}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}

      {view === "month" && (
        <View style={{ flex: 1 }}>
          <MonthContainer
            config={config}
            colWidth={colWidth}
            locale={locale ?? config.locale}
            onRefresh={onRefresh}
            refreshing={refreshing}
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
        onSubmit={async (payload, targetCalendarId) => {
          try {
            await createCalendarEvent(payload, targetCalendarId);
          } catch (err) {
            showMutationError(
              err instanceof Error
                ? err.message
                : t("planner.event.createFailed")
            );
            throw err;
          }
        }}
      />

      <DayViewModal
        visible={dayModalOpen}
        day={dayModalDate}
        onClose={closeDayModal}
        config={config}
        locale={locale ?? config.locale}
        weekView={{
          startHour: 0,
          endHour: 24,
          stepMinutes: 15,
          pxPerMinute: 1.2,
          ...weekView,
        }}
      />

      {editEvent ? (
        <UpsertEventModal
          mode="edit"
          visible={editOpen}
          day={new Date(editEvent.start)}
          event={editEvent}
          locale={locale ?? config.locale}
          timezone={config.timezone}
          onClose={closeEdit}
          onSubmit={async (id, patch) => {
            try {
              await updateCalendarEvent(editEvent, patch);
            } catch (err) {
              showMutationError(
                err instanceof Error
                  ? err.message
                  : t("planner.event.updateFailedShort")
              );
              throw err;
            }
          }}
          onDelete={() => {
            closeEdit();
            confirmDeleteToast(editEvent);
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
