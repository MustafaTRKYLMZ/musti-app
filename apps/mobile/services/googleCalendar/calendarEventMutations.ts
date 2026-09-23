import {
  LOCAL_CALENDAR_ID,
  isGoogleEvent,
  isWritableCalendarFeed,
  type CalendarFeed,
  type MEvent,
} from "@musti/planner";
import { useCalendarEventsStore } from "@/store/calendar/useCalendarEventsStore";
import { useCalendarSourcesStore } from "@/store/calendar/useCalendarSourcesStore";
import { getValidGoogleAccessToken } from "./accessToken";
import {
  deleteGoogleCalendarEvent,
  mapGoogleEventToMEvent,
} from "./googleCalendarApi";
import {
  isGoogleInsufficientScopeError,
  logGoogleApiFailure,
  logGoogleMutationStart,
} from "./googleCalendarDebug";
import { revokeAndDeleteGoogleTokens } from "./accessToken";
import {
  writeGoogleCalendarEventInsert,
  writeGoogleCalendarEventUpdate,
} from "./googleCalendarWrite";

function getFeed(feedId: string): CalendarFeed | null {
  return (
    useCalendarSourcesStore.getState().feeds.find((f) => f.id === feedId) ??
    null
  );
}

function getAccount(accountId: string) {
  return (
    useCalendarSourcesStore
      .getState()
      .accounts.find((a) => a.id === accountId) ?? null
  );
}

function mergeGoogleEvent(
  feed: CalendarFeed,
  account: NonNullable<ReturnType<typeof getAccount>>,
  raw: Parameters<typeof mapGoogleEventToMEvent>[0]
): MEvent {
  const mapped = mapGoogleEventToMEvent(raw, feed, account);
  if (!mapped) {
    throw new Error("Google returned an invalid event.");
  }
  return mapped;
}

async function googleAccessForFeed(feed: CalendarFeed): Promise<string> {
  const token = await getValidGoogleAccessToken(feed.accountId);
  if (!token) {
    throw new Error("Google session expired. Connect your account again.");
  }
  return token;
}

function rethrowGoogleWriteError(feed: CalendarFeed, err: unknown): never {
  if (isGoogleInsufficientScopeError(err)) {
    void revokeAndDeleteGoogleTokens(feed.accountId);
    throw new Error(
      "Google calendar editing permission is missing. Open Settings, disconnect, then connect again."
    );
  }
  throw err;
}

export async function createCalendarEvent(
  payload: Omit<MEvent, "id">,
  targetCalendarId: string
): Promise<MEvent> {
  const feed = getFeed(targetCalendarId);
  if (!feed) {
    throw new Error("Selected calendar is no longer available.");
  }

  if (feed.provider === "local" || targetCalendarId === LOCAL_CALENDAR_ID) {
    return useCalendarEventsStore.getState().addEvent({
      ...payload,
      source: "planner",
      calendarId: LOCAL_CALENDAR_ID,
    });
  }

  const account = getAccount(feed.accountId);
  if (!account) {
    throw new Error("Google account not found.");
  }

  if (!isWritableCalendarFeed(feed)) {
    throw new Error(
      `"${feed.name}" is read-only. Choose Primary or My Planner in the event form.`
    );
  }

  if (!feed.enabled) {
    useCalendarSourcesStore.getState().enableFeed(feed.id);
  }

  const accessToken = await googleAccessForFeed(feed);
  let raw;
  try {
    raw = await writeGoogleCalendarEventInsert(accessToken, feed, payload);
  } catch (err) {
    logGoogleApiFailure("create", { feed: feed.name, targetCalendarId }, err);
    rethrowGoogleWriteError(feed, err);
  }
  const event = mergeGoogleEvent(feed, account, raw);
  useCalendarEventsStore.getState().mergeEvent(event);
  return event;
}

export async function updateCalendarEvent(
  event: MEvent,
  patch: Partial<MEvent>
): Promise<MEvent> {
  const next: MEvent = { ...event, ...patch };

  if (!isGoogleEvent(event)) {
    useCalendarEventsStore.getState().updateEvent(event.id, patch);
    return { ...event, ...patch };
  }

  const feed = getFeed(event.calendarId ?? "");
  if (!feed || !event.externalId) {
    throw new Error("Google event calendar is missing.");
  }

  const account = getAccount(feed.accountId);
  if (!account) {
    throw new Error("Google account not found.");
  }

  if (!isWritableCalendarFeed(feed)) {
    throw new Error(`"${feed.name}" is read-only and cannot be edited.`);
  }

  const accessToken = await googleAccessForFeed(feed);
  let raw;
  try {
    raw = await writeGoogleCalendarEventUpdate(
      accessToken,
      feed,
      event.externalId,
      next
    );
  } catch (err) {
    logGoogleApiFailure("update", { feed: feed.name, eventId: event.id }, err);
    rethrowGoogleWriteError(feed, err);
  }
  const updated = mergeGoogleEvent(feed, account, raw);
  useCalendarEventsStore.getState().mergeEvent(updated);
  return updated;
}

export async function deleteCalendarEvent(event: MEvent): Promise<void> {
  if (!isGoogleEvent(event)) {
    useCalendarEventsStore.getState().deleteEvent(event.id);
    return;
  }

  const feed = getFeed(event.calendarId ?? "");
  if (!feed || !event.externalId) {
    throw new Error("Google event calendar is missing.");
  }

  const accessToken = await googleAccessForFeed(feed);
  logGoogleMutationStart("delete", feed, { externalEventId: event.externalId });
  try {
    await deleteGoogleCalendarEvent(
      accessToken,
      feed.externalCalendarId,
      event.externalId
    );
  } catch (err) {
    logGoogleApiFailure("delete", { feed: feed.name, eventId: event.id }, err);
    throw err;
  }
  useCalendarEventsStore.getState().removeEventById(event.id);
}
