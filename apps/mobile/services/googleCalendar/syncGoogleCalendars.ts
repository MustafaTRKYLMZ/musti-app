import type { CalendarFeed, GoogleAccount } from "@musti/planner";
import { useCalendarEventsStore } from "@/store/calendar/useCalendarEventsStore";
import { useCalendarSourcesStore } from "@/store/calendar/useCalendarSourcesStore";
import { getValidGoogleAccessToken } from "./accessToken";
import {
  fetchGoogleCalendarEvents,
  mapGoogleEventToMEvent,
} from "./googleCalendarApi";

const SYNC_PAST_DAYS = 90;
const SYNC_FUTURE_DAYS = 180;

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
  feeds: CalendarFeed[]
): Promise<GoogleSyncResult> {
  const enabledGoogleFeeds = feeds.filter(
    (f) => f.accountId === account.id && f.provider === "google" && f.enabled
  );

  const result: GoogleSyncResult = {
    syncedFeeds: 0,
    importedEvents: 0,
    errors: [],
  };

  if (enabledGoogleFeeds.length === 0) {
    return result;
  }

  const accessToken = await getValidGoogleAccessToken(account.id);
  if (!accessToken) {
    result.errors.push(
      `Session expired for ${account.email}. Connect Google again.`
    );
    return result;
  }

  const { timeMin, timeMax } = syncWindow();
  const upsertExternalEvents =
    useCalendarEventsStore.getState().upsertExternalEvents;
  const markFeedSynced = useCalendarSourcesStore.getState().markFeedSynced;

  for (const feed of enabledGoogleFeeds) {
    try {
      const raw = await fetchGoogleCalendarEvents(
        accessToken,
        feed.externalCalendarId,
        timeMin,
        timeMax
      );

      const mapped = raw
        .map((item) => mapGoogleEventToMEvent(item, feed, account))
        .filter((event): event is NonNullable<typeof event> => Boolean(event));

      upsertExternalEvents(feed.id, mapped);
      markFeedSynced(feed.id);
      result.syncedFeeds += 1;
      result.importedEvents += mapped.length;
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
