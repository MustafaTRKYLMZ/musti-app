import type { CalendarFeed, MEvent } from "@musti/planner";
import {
  googleCalendarIdsForWrite,
  insertGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  type GoogleEventItem,
} from "./googleCalendarApi";
import {
  debugLogGoogleToken,
  logGoogleApiFailure,
  logGoogleMutationStart,
} from "./googleCalendarDebug";

type EventPayload = Pick<
  MEvent,
  "title" | "start" | "end" | "allDay" | "notes" | "location" | "timezone"
>;

type GoogleApiError = Error & { status?: number; body?: string };

async function tryCalendarIds<T>(
  operation: "create" | "update",
  feed: CalendarFeed,
  fn: (calendarId: string) => Promise<T>
): Promise<T> {
  const ids = googleCalendarIdsForWrite(feed);
  let lastErr: unknown;

  for (let i = 0; i < ids.length; i++) {
    const calendarId = ids[i];
    const isLast = i === ids.length - 1;
    if (__DEV__) {
      console.log(
        `[Google Calendar] ${operation} attempt`,
        calendarId,
        `(${feed.name})`
      );
    }
    try {
      return await fn(calendarId);
    } catch (err) {
      lastErr = err;
      logGoogleApiFailure(
        `${operation} (${calendarId})`,
        { feed: feed.name },
        err
      );
      const status = (err as GoogleApiError).status;
      if (status === 403 && !isLast) {
        if (__DEV__) {
          console.warn(
            `[Google Calendar] ${operation} 403 on ${calendarId}, retrying alternate id…`
          );
        }
        continue;
      }
      throw err;
    }
  }

  throw lastErr;
}

export async function writeGoogleCalendarEventInsert(
  accessToken: string,
  feed: CalendarFeed,
  payload: EventPayload
): Promise<GoogleEventItem> {
  logGoogleMutationStart("create", feed);
  await debugLogGoogleToken(accessToken, "before create");
  return tryCalendarIds("create", feed, (calendarId) =>
    insertGoogleCalendarEvent(accessToken, calendarId, payload)
  );
}

export async function writeGoogleCalendarEventUpdate(
  accessToken: string,
  feed: CalendarFeed,
  externalEventId: string,
  payload: EventPayload
): Promise<GoogleEventItem> {
  logGoogleMutationStart("update", feed, { externalEventId });
  await debugLogGoogleToken(accessToken, "before update");
  return tryCalendarIds("update", feed, (calendarId) =>
    updateGoogleCalendarEvent(accessToken, calendarId, externalEventId, payload)
  );
}
