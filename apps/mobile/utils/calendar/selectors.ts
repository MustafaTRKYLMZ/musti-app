import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { MEvent, CalendarConfig } from "@musti/planner";

dayjs.extend(utc);
dayjs.extend(timezone);

function startOfWeek(d: dayjs.Dayjs, weekStartsOn: number) {
  const dow = d.day();
  const diff = (dow - weekStartsOn + 7) % 7;
  return d.subtract(diff, "day").startOf("day");
}

export function getWeekRange(date: Date, cfg: CalendarConfig) {
  const weekStartsOn = cfg.weekStartsOn ?? 1;
  const base = cfg.timezone ? dayjs(date).tz(cfg.timezone) : dayjs(date);
  const start = startOfWeek(base, weekStartsOn);
  const end = start.add(7, "day");
  return { start, end };
}

export function selectEventsForWeek(params: {
  events: MEvent[];
  anchorDate: Date; 
  calendar: CalendarConfig;
}): MEvent[] {
  const { start, end } = getWeekRange(params.anchorDate, params.calendar);

  return params.events.filter((e) => {
    const s = params.calendar.timezone ? dayjs(e.start).tz(params.calendar.timezone) : dayjs(e.start);
    const en = params.calendar.timezone ? dayjs(e.end).tz(params.calendar.timezone) : dayjs(e.end);

    if (!s.isValid() || !en.isValid() || !en.isAfter(s)) return false;

    return s.isBefore(end) && en.isAfter(start);
  });
}
