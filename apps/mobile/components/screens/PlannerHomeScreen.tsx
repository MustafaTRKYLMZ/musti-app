import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { MCalendar } from "@musti/calendar";

export const PlannerHomeScreen = () => {
  const [date, setDate] = useState(new Date());

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [events, setEvents] = useState<Event[]>([
    {
      id: "1",
      title: "English",
      start: new Date().toISOString(),
      end: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      color: "#2F6FED",
    },
  ]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsForDay(selectedDate, events);
  }, [selectedDate, events]);

  const onCreate = (day: Date, startMinute?: number) => {
    const start = new Date(day);
    if (startMinute != null) {
      start.setHours(Math.floor(startMinute / 60), startMinute % 60, 0, 0);
    }
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const newEvent: Event = {
      id: String(Date.now()),
      title: "New event",
      start: start.toISOString(),
      end: end.toISOString(),
      color: "#2F6FED",
    };

    setEvents((prev) => [newEvent, ...prev]);

    setSelectedDate(day);
    setSheetOpen(true);
  };

  const onEventChange = (next: Event) => {
    setEvents((prev) => prev.map((e) => (e.id === next.id ? next : e)));
    // TODO: burada Google Calendar primary events.update (sonraki aşama)
  };

  return (
    <View style={{ flex: 1 }}>
      <MCalendar
        view="week"
        date={date}
        events={events}
        config={{ weekStartsOn: 1, locale: "tr" }}
        weekView={{
          stepMinutes: 15,
          pxPerMinute: 1.2,
          startHour: 7,
          endHour: 23,
        }}
        onPressDay={(d) => {
          setSelectedDate(d);
          setSheetOpen(true);
        }}
        onCreate={onCreate}
        onEventChange={onEventChange}
        onPressEvent={(e) => {
          const d = new Date(e.start);
          setSelectedDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
          setSheetOpen(true);
        }}
      />

      <FloatingCreateButton onPress={() => onCreate(selectedDate ?? date)} />

      {selectedDate && sheetOpen && (
        <BottomDaySheet
          date={selectedDate}
          events={selectedEvents}
          onCreate={() => onCreate(selectedDate)}
          onPressEvent={(e) => console.log("event", e.id)}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </View>
  );
};
