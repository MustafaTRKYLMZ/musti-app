import React, { useMemo, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isoWeek from "dayjs/plugin/isoWeek";

import { AppScreen } from "../AppScreen";
import { spacing, radii } from "@musti/ui-native";
import { PlannerHeaderCenter } from "../planner/PlannerHeaderCenter";
import { PlannerHeaderRight } from "../planner/PlannerHeaderRight";
import { PlannerHeaderLeft } from "../planner/PlannerHeaderLeft";
import { BottomDaySheet } from "../planner/BottomDaySheet";
import { FloatingCreateButton } from "../planner/FloatingCreateButton";
import { MCalendar } from "../planner/MCalendar";

import { useCalendarEventsStore } from "@/store/calendar/useCalendarEventsStore";
import { useCalendarUiStore } from "@/store/calendar/useCalendarUiStore";
import { eventsForDay, type MEvent } from "@musti/planner";

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.locale("en");

export const PlannerHomeScreen = () => {
  const view = useCalendarUiStore((s) => s.view);
  const date = useCalendarUiStore((s) => s.date);
  const selectedDate = useCalendarUiStore((s) => s.selectedDate);
  const daySheetOpen = useCalendarUiStore((s) => s.daySheetOpen);

  const setView = useCalendarUiStore((s) => s.setView);
  const setDate = useCalendarUiStore((s) => s.setDate);
  const openDay = useCalendarUiStore((s) => s.openDay);
  const closeDaySheet = useCalendarUiStore((s) => s.closeDaySheet);
  const openCreate = useCalendarUiStore((s) => s.openCreate);

  const pressEvent = useCalendarUiStore((s) => s.pressEvent);

  const events = useCalendarEventsStore((s) => s.events);

  const weekNumber = useMemo(() => dayjs(date).isoWeek(), [date]);
  const selectedLabel = useMemo(() => dayjs(date).format("MMMM"), [date]);

  const selectedEvents = useMemo(() => {
    return eventsForDay(selectedDate, events);
  }, [selectedDate, events]);

  const onPressFab = useCallback(() => {
    openCreate(selectedDate);
    openDay(selectedDate);
  }, [openCreate, openDay, selectedDate]);

  const onPressToday = useCallback(() => {
    const today = new Date();
    setDate(today);
    openDay(today);
  }, [setDate, openDay]);

  return (
    <AppScreen
      headerLeft={<PlannerHeaderLeft weekNumber={weekNumber} />}
      variant="planner"
      headerCenter={
        <PlannerHeaderCenter
          onPressToday={onPressToday}
          label={selectedLabel}
        />
      }
      headerRight={<PlannerHeaderRight />}
    >
      <View style={styles.body}>
        <MCalendar
          config={{ weekStartsOn: 1, locale: "en" }}
          weekView={{
            stepMinutes: 15,
            pxPerMinute: 1.15,
            startHour: 1,
            endHour: 24,
          }}
          onEventChange={() => {}}
        />

        <FloatingCreateButton onPress={onPressFab} />

        {daySheetOpen && (
          <BottomDaySheet
            date={selectedDate}
            events={selectedEvents}
            onCreate={() => openCreate(selectedDate)}
            onPressEvent={(e: MEvent) => pressEvent(e.id, e.start)}
            onClose={closeDaySheet}
          />
        )}
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  body: { flex: 1 },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  smallBtn: {
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
});
