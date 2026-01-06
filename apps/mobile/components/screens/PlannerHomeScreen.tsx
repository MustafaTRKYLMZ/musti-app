import React, { useMemo, useState, useCallback } from "react";
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
import { MEvent, eventsForDay } from "@musti/planner";
import { BottomDaySheet } from "../planner/BottomDaySheet";
import { FloatingCreateButton } from "../planner/FloatingCreateButton";
import { MCalendar } from "../planner/MCalendar";
import { useCalendarEventsStore } from "@/store/calendar/useCalendarEventsStore";

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.locale("en");

type CalendarView = "week" | "month";

const clampDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const PlannerHomeScreen = () => {
  const [view, setView] = useState<CalendarView>("month");
  const [date, setDate] = useState(new Date());

  const events = useCalendarEventsStore((s) => s.events);

  const [selectedDate, setSelectedDate] = useState<Date | null>(
    clampDay(new Date())
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const [openCreateToken, setOpenCreateToken] = useState<number | null>(null);

  const weekNumber = useMemo(() => dayjs(date).isoWeek(), [date]);

  const selectedLabel = useMemo(() => dayjs(date).format("MMMM"), [date]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsForDay(selectedDate, events);
  }, [selectedDate, events]);

  const openDay = useCallback((d: Date) => {
    const dd = clampDay(d);
    setSelectedDate(dd);
    setSheetOpen(true);
  }, []);

  const onPressFab = useCallback(() => {
    const day = selectedDate ?? clampDay(date);
    setOpenCreateToken((x) => (x ?? 0) + 1);
    openDay(day);
  }, [selectedDate, date, openDay]);

  const onPressToday = useCallback(() => {
    const today = new Date();
    setDate(today);
    openDay(today);
  }, [openDay]);

  const effectiveSelectedDate =
    selectedDate && dayjs(selectedDate).isSame(date, "week")
      ? selectedDate
      : clampDay(date);

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
      headerRight={
        <PlannerHeaderRight
          view={view}
          onToggleView={() => setView((v) => (v === "week" ? "month" : "week"))}
        />
      }
    >
      <View style={styles.body}>
        <MCalendar
          setDate={setDate}
          view={view}
          date={date}
          config={{ weekStartsOn: 1, locale: "en" }}
          weekView={{
            stepMinutes: 15,
            pxPerMinute: 1.15,
            startHour: 1,
            endHour: 24,
          }}
          onPressDay={(d) => openDay(d)}
          onPressEvent={(e: MEvent) => {
            const d = new Date(e.start);
            openDay(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
          }}
          onEventChange={() => {}}
          openCreateToken={openCreateToken ?? undefined}
          openCreateDay={selectedDate ?? clampDay(date)}
        />

        <FloatingCreateButton onPress={onPressFab} />

        {effectiveSelectedDate && sheetOpen && selectedDate && (
          <BottomDaySheet
            date={selectedDate}
            events={selectedEvents}
            onCreate={() => setOpenCreateToken((x) => (x ?? 0) + 1)}
            onPressEvent={(e) => {
              console.log("event", e.id);
            }}
            onClose={() => setSheetOpen(false)}
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
