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

export function isWritableCalendarFeed(feed: CalendarFeed): boolean {
  if (feed.provider === "local") return true;
  const role = feed.accessRole;
  if (role === "owner" || role === "writer") return true;
  // Legacy feeds without role: only primary is assumed writable.
  if (!role && feed.isPrimary) return true;
  return false;
}

export function getWritableCalendarFeeds(feeds: CalendarFeed[]): CalendarFeed[] {
  return feeds.filter(isWritableCalendarFeed);
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
