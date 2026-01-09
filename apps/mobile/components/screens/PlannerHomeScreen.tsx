import React, { useMemo, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isoWeek from "dayjs/plugin/isoWeek";

import { AppScreen } from "../AppScreen";
import { spacing, radii, Spinner } from "@musti/ui-native";
import { PlannerHeaderCenter } from "../planner/PlannerHeaderCenter";
import { PlannerHeaderRight } from "../planner/PlannerHeaderRight";
import { PlannerHeaderLeft } from "../planner/PlannerHeaderLeft";
import { BottomDaySheet } from "../planner/BottomDaySheet";
import { FloatingCreateButton } from "../planner/FloatingCreateButton";
import { Calendar } from "../planner/Calendar";
import { eventsForDay, MEvent } from "@musti/planner";
import { useCalendar } from "@/hooks/useCalendar";

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.locale("en");

export const PlannerHomeScreen = () => {
  const {
    date,
    selectedDate,
    daySheetOpen,
    setDate,
    openDay,
    closeDaySheet,
    openCreate,
    pressEvent,
    hasHydrated,
    events,
  } = useCalendar();

  const weekNumber = useMemo(() => dayjs(date).isoWeek(), [date]);
  const selectedLabel = useMemo(() => dayjs(date).format("MMMM"), [date]);

  const selectedEvents = useMemo(() => {
    return eventsForDay(selectedDate, events);
  }, [selectedDate, events]);

  const onPressFab = useCallback(() => {
    openCreate(selectedDate);
  }, [openCreate, selectedDate]);

  const onPressToday = useCallback(() => {
    const today = new Date();
    setDate(today);
    openDay(today);
  }, [setDate, openDay]);

  if (!hasHydrated) {
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
        <View style={[styles.body, styles.center]}>
          <Spinner />
        </View>
      </AppScreen>
    );
  }

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
        <Calendar
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
  center: { justifyContent: "center", alignItems: "center" },

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
