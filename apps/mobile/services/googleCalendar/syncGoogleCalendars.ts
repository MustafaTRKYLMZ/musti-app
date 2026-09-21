import type { CalendarFeed, GoogleAccount } from "@musti/planner";
import { useCalendarEventsStore } from "@/store/calendar/useCalendarEventsStore";
import { useCalendarSourcesStore } from "@/store/calendar/useCalendarSourcesStore";
import { getValidGoogleAccessToken } from "./accessToken";
import {
  fetchGoogleCalendarEvents,
  fetchGoogleCalendarList,
  mapGoogleEventToMEvent,
} from "./googleCalendarApi";

function canSyncEvents(feed: CalendarFeed): boolean {
  const role = feed.accessRole ?? "reader";
  return role === "owner" || role === "writer" || role === "reader";
}

const SYNC_PAST_DAYS = 365;
const SYNC_FUTURE_DAYS = 365;

function syncWindow(): { timeMin: string; timeMax: string } {
  const now = new Date();
  const min = new Date(now);
  min.setDate(min.getDate() - SYNC_PAST_DAYS);
  const max = new Date(now);
  max.setDate(max.getDate() + SYNC_FUTURE_DAYS);
  return {
    timeMin: min.toISOString(),
    timeMax: max.toISOString(),
  };
}

export type GoogleSyncResult = {
  syncedFeeds: number;
  importedEvents: number;
  errors: string[];
};

export async function syncGoogleCalendarsForAccount(
  account: GoogleAccount,
  _feeds: CalendarFeed[]
): Promise<GoogleSyncResult> {
  const result: GoogleSyncResult = {
    syncedFeeds: 0,
    importedEvents: 0,
    errors: [],
  };

  const accessToken = await getValidGoogleAccessToken(account.id);
  if (!accessToken) {
    result.errors.push(
      `Session expired for ${account.email}. Connect Google again.`
    );
    return result;
  }

  const calendarList = await fetchGoogleCalendarList(accessToken);
  useCalendarSourcesStore
    .getState()
    .mergeGoogleFeedsForAccount(account, calendarList);

  const latestFeeds = useCalendarSourcesStore.getState().feeds;
  const accountFeeds = latestFeeds.filter(
    (f) => f.accountId === account.id && f.provider === "google"
  );
  const enabledGoogleFeeds = accountFeeds.filter(
    (f) => (f.enabled || f.isPrimary) && canSyncEvents(f)
  );

  if (__DEV__) {
    const primary = accountFeeds.find((f) => f.isPrimary);
    console.log(
      `[Google Calendar] ${account.email}: ${accountFeeds.length} calendars` +
        (primary ? `, primary="${primary.name}"` : ", primary missing!")
    );
  }

  if (enabledGoogleFeeds.length === 0) {
    result.errors.push(`No readable calendars enabled for ${account.email}.`);
    return result;
  }

  useCalendarEventsStore.getState().removeEventsForAccount(account.id);

  const { timeMin, timeMax } = syncWindow();
  const upsertExternalEvents =
    useCalendarEventsStore.getState().upsertExternalEvents;
  const markFeedSynced = useCalendarSourcesStore.getState().markFeedSynced;

  for (const feed of enabledGoogleFeeds) {
    try {
      let raw = await fetchGoogleCalendarEvents(
        accessToken,
        feed.externalCalendarId,
        timeMin,
        timeMax
      );

      if (raw.length === 0 && feed.isPrimary) {
        raw = await fetchGoogleCalendarEvents(
          accessToken,
          "primary",
          timeMin,
          timeMax
        );
      }

      const mapped = raw
        .map((item) => mapGoogleEventToMEvent(item, feed, account))
        .filter((event): event is NonNullable<typeof event> => Boolean(event));

      upsertExternalEvents(feed.id, mapped);
      markFeedSynced(feed.id);
      result.syncedFeeds += 1;
      result.importedEvents += mapped.length;
      if (__DEV__) {
        const tag = feed.isPrimary ? " [primary]" : "";
        console.log(
          `[Google Calendar] ${feed.name}${tag}: ${raw.length} raw → ${mapped.length} imported`
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown sync error";
      result.errors.push(`${feed.name}: ${message}`);
    }
  }

  return result;
}

export async function syncAllGoogleCalendars(): Promise<GoogleSyncResult> {
  const { accounts, feeds } = useCalendarSourcesStore.getState();
  const aggregate: GoogleSyncResult = {
    syncedFeeds: 0,
    importedEvents: 0,
    errors: [],
  };

  for (const account of accounts) {
    const partial = await syncGoogleCalendarsForAccount(account, feeds);
    aggregate.syncedFeeds += partial.syncedFeeds;
    aggregate.importedEvents += partial.importedEvents;
    aggregate.errors.push(...partial.errors);
  }

  useCalendarSourcesStore.getState().setLastGlobalSyncAt(new Date().toISOString());
  return aggregate;
}
