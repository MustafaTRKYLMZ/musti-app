import { CalendarFeed, LOCAL_CALENDAR_ID } from "./types";

export function createLocalCalendarFeed(): CalendarFeed {
  return {
    id: LOCAL_CALENDAR_ID,
    accountId: "local",
    provider: "local",
    externalCalendarId: LOCAL_CALENDAR_ID,
    name: "My Planner",
    color: "#16A34A",
    enabled: true,
    isPrimary: true,
  };
}

export function filterEventsByEnabledCalendars<
  T extends { calendarId?: string; source?: string; externalId?: string },
>(events: T[], enabledFeedIds: Set<string>): T[] {
  return events.filter((event) => {
    if (event.source === "google" || event.externalId) {
      return event.calendarId ? enabledFeedIds.has(event.calendarId) : false;
    }
    if (!event.calendarId || event.calendarId === LOCAL_CALENDAR_ID) {
      return enabledFeedIds.has(LOCAL_CALENDAR_ID);
    }
    return enabledFeedIds.has(event.calendarId);
  });
}
