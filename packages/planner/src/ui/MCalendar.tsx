import React from "react";
import type {
  CalendarConfig,
  MEvent,
  WeekViewConfig,
  CalendarView,
} from "../types";
import { WeekView } from "./WeekView";

export function MCalendar(props: {
  view: CalendarView; // "week"
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
  const config: CalendarConfig = {
    locale: "en",
    weekStartsOn: 1,
    ...props.config,
  };

  return (
    <WeekView
      date={props.date}
      events={props.events}
      config={config}
      locale={props.locale ?? config.locale}
      weekView={
        {
          startHour: 7,
          endHour: 24,
          stepMinutes: 30,
          pxPerMinute: 1.2,
          ...props.weekView,
        } as WeekViewConfig
      }
      onChangeDate={props.setDate}
      onPressEvent={props.onPressEvent}
      onPressDay={props.onPressDay}
      onCreate={props.onCreate}
      onEventChange={props.onEventChange}
    />
  );
}
