import React from "react";
import type {
  CalendarConfig,
  Event,
  WeekViewConfig,
  CalendarView,
} from "../types";
import { WeekView } from "./WeekView";

export function MCalendar(props: {
  view: CalendarView; // "week"
  date: Date;
  events: Event[];
  config?: CalendarConfig;
  locale?: string;

  weekView?: Partial<WeekViewConfig>;

  onPressEvent?: (e: Event) => void;
  onPressDay?: (d: Date) => void;

  onCreate?: (day: Date, startMinute?: number) => void;
  onEventChange?: (next: Event) => void;
}) {
  const config: CalendarConfig = {
    locale: "tr",
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
          endHour: 23,
          stepMinutes: 30,
          pxPerMinute: 1.2,
          ...props.weekView,
        } as WeekViewConfig
      }
      onPressEvent={props.onPressEvent}
      onPressDay={props.onPressDay}
      onCreate={props.onCreate}
      onEventChange={props.onEventChange}
    />
  );
}
