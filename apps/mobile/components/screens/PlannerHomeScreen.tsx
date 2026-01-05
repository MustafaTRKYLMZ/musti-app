import React, { useMemo, useState, useCallback } from "react";
import { View, StyleSheet, Alert } from "react-native";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isoWeek from "dayjs/plugin/isoWeek";
import {
  BottomDaySheet,
  eventsForDay,
  FloatingCreateButton,
  MCalendar,
  MEvent,
} from "@musti/planner";
import { AppScreen } from "../AppScreen";
import { spacing, useTheme, radii } from "@musti/ui-native";
import { PlannerHeaderCenter } from "../planner/PlannerHeaderCenter";
import { PlannerHeaderRight } from "../planner/PlannerHeaderRight";
import { PlannerHeaderLeft } from "../planner/PlannerHeaderLeft";

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.locale("en");

type CalendarView = "week" | "month";

const EVENT_COLORS = [
  "#22C55E", // green
  "#2F6FED", // blue
  "#F59E0B", // amber
  "#FB7185", // pink
  "#A78BFA", // purple
];

const clampDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

const makeEventId = () => String(Date.now() + Math.floor(Math.random() * 999));

export const PlannerHomeScreen = () => {
  const { colors } = useTheme();

  const [view, setView] = useState<CalendarView>("week");
  const [date, setDate] = useState(new Date());

  const [selectedDate, setSelectedDate] = useState<Date | null>(
    clampDay(new Date())
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const [events, setEvents] = useState<MEvent[]>([
    {
      id: "1",
      title: "English",
      start: new Date().toISOString(),
      end: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      color: "#2F6FED",
    },
  ]);

  const weekNumber = useMemo(() => dayjs(date).isoWeek(), [date]);

  const selectedLabel = useMemo(() => {
    return dayjs(date).format("MMMM");
  }, [date]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsForDay(selectedDate, events);
  }, [selectedDate, events]);

  const pickColor = useCallback(() => {
    // rotate based on event count, looks consistent
    return EVENT_COLORS[events.length % EVENT_COLORS.length];
  }, [events.length]);

  const openDay = useCallback((d: Date) => {
    const dd = clampDay(d);
    setSelectedDate(dd);
    setSheetOpen(true);
  }, []);

  const onCreate = useCallback(
    (day: Date, startMinute?: number, durationMinutes: number = 30) => {
      const start = new Date(day);
      if (startMinute != null) {
        start.setHours(Math.floor(startMinute / 60), startMinute % 60, 0, 0);
      } else {
        // default: now rounded to next 15
        const now = new Date();
        const m = now.getMinutes();
        const rounded = Math.ceil(m / 15) * 15;
        start.setHours(now.getHours(), rounded % 60, 0, 0);
        if (rounded >= 60) start.setHours(now.getHours() + 1, 0, 0, 0);
      }

      const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

      const newEvent: MEvent = {
        id: makeEventId(),
        title: "New event",
        start: start.toISOString(),
        end: end.toISOString(),
        color: pickColor(),
      };

      setEvents((prev) => [newEvent, ...prev]);
      openDay(day);
    },
    [openDay, pickColor]
  );

  const onEventChange = useCallback((next: MEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === next.id ? next : e)));
  }, []);

  const onPressFab = useCallback(() => {
    const day = selectedDate ?? clampDay(date);
    onCreate(day, undefined, 30);
  }, [selectedDate, date, onCreate]);

  const onLongPressFab = useCallback(() => {
    const day = selectedDate ?? clampDay(date);

    Alert.alert("Create event", "Choose duration", [
      { text: "15 min", onPress: () => onCreate(day, undefined, 15) },
      { text: "30 min", onPress: () => onCreate(day, undefined, 30) },
      { text: "60 min", onPress: () => onCreate(day, undefined, 60) },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [selectedDate, date, onCreate]);

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
      <View style={[styles.body]}>
        <MCalendar
          setDate={setDate}
          view={view}
          date={date}
          events={events}
          config={{ weekStartsOn: 1, locale: "en" }}
          weekView={{
            stepMinutes: 15,
            pxPerMinute: 1.15,
            startHour: 7,
            endHour: 23,
          }}
          onPressDay={(d) => openDay(d)}
          onCreate={(day, startMinute) => onCreate(day, startMinute, 30)}
          onEventChange={onEventChange}
          onPressEvent={(e) => {
            const d = new Date(e.start);
            openDay(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
          }}
        />

        <FloatingCreateButton
          onPress={onPressFab}
          onLongPress={onLongPressFab}
        />

        {effectiveSelectedDate && sheetOpen && selectedDate && (
          <BottomDaySheet
            date={selectedDate}
            events={selectedEvents}
            onCreate={() => onCreate(selectedDate, undefined, 30)}
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
  headerCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },

  headerTitle: {
    lineHeight: 22,
  },

  headerSubtitle: {
    fontSize: 12,
    opacity: 0.85,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  headerSub: {
    marginTop: 2,
    fontSize: 12,
  },

  smallBtn: {
    paddingHorizontal: spacing.sm,

    borderRadius: radii.lg,
    borderWidth: 1,
  },
});
