import type { CalendarFeed, GoogleAccount, MEvent } from "@musti/planner";
import { getGoogleOAuthClientId } from "@/constants/googleCalendarConfig";

type GoogleCalendarListItem = {
  id: string;
  summary?: string;
  backgroundColor?: string;
  primary?: boolean;
  accessRole?: string;
};

export type GoogleEventItem = {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  colorId?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
};

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const USERINFO_API = "https://www.googleapis.com/oauth2/v3/userinfo";

async function googleRequest<T>(
  url: string,
  accessToken: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (__DEV__) {
      console.error(
        "[Google Calendar API]",
        init?.method ?? "GET",
        url,
        "→",
        res.status,
        body || res.statusText
      );
    }
    const err = new Error(
      googleApiErrorMessage(res.status, body || res.statusText)
    ) as Error & { status?: number; body?: string };
    err.status = res.status;
    err.body = body;
    throw err;
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

function googleApiErrorMessage(status: number, body: string): string {
  if (status === 403) {
    if (/insufficient|scope|permission/i.test(body)) {
      return "Google permission denied. Open Settings, disconnect and reconnect your Google account.";
    }
    return "This calendar is read-only. Pick Primary or My Planner when creating events.";
  }
  if (status === 401) {
    return "Google session expired. Reconnect your account in Settings.";
  }
  return `Google Calendar API error (${status}): ${body}`;
}

async function googleFetch<T>(url: string, accessToken: string): Promise<T> {
  return googleRequest<T>(url, accessToken);
}

export function googleCalendarIdsForWrite(feed: {
  isPrimary?: boolean;
  externalCalendarId: string;
}): string[] {
  const ids = [feed.externalCalendarId];
  if (feed.isPrimary) {
    ids.push("primary");
  }
  return [...new Set(ids)];
}

export function googleCalendarIdForWrite(feed: {
  isPrimary?: boolean;
  externalCalendarId: string;
}): string {
  return feed.externalCalendarId;
}

export async function fetchGoogleUserProfile(accessToken: string): Promise<{
  email: string;
  name?: string;
}> {
  const json = await googleFetch<{ email?: string; name?: string }>(
    USERINFO_API,
    accessToken
  );
  if (!json.email) {
    throw new Error("Google account email not available.");
  }
  return { email: json.email, name: json.name };
}

export async function fetchGoogleCalendarList(
  accessToken: string
): Promise<GoogleCalendarListItem[]> {
  const items: GoogleCalendarListItem[] = [];
  let pageToken: string | undefined;

  do {
    const qs = new URLSearchParams({
      minAccessRole: "reader",
      showHidden: "true",
    });
    if (pageToken) qs.set("pageToken", pageToken);

    const json = await googleFetch<{
      items?: GoogleCalendarListItem[];
      nextPageToken?: string;
    }>(`${CALENDAR_API}/users/me/calendarList?${qs.toString()}`, accessToken);

    items.push(...(json.items ?? []));
    pageToken = json.nextPageToken;
  } while (pageToken);

  const byId = new Map(items.map((item) => [item.id, item]));

  if (![...byId.values()].some((item) => item.primary)) {
    try {
      const primary = await googleFetch<GoogleCalendarListItem>(
        `${CALENDAR_API}/users/me/calendarList/primary`,
        accessToken
      );
      byId.set(primary.id, { ...primary, primary: true });
    } catch {
      // Primary endpoint unavailable — fall back to list contents.
    }
  }

  return [...byId.values()];
}

export async function fetchGoogleCalendarEvents(
  accessToken: string,
  externalCalendarId: string,
  timeMin: string,
  timeMax: string
): Promise<GoogleEventItem[]> {
  const items: GoogleEventItem[] = [];
  let pageToken: string | undefined;

  do {
    const qs = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
    });
    if (pageToken) qs.set("pageToken", pageToken);

    const encodedCal = encodeURIComponent(externalCalendarId);
    const json = await googleFetch<{
      items?: GoogleEventItem[];
      nextPageToken?: string;
    }>(
      `${CALENDAR_API}/calendars/${encodedCal}/events?${qs.toString()}`,
      accessToken
    );

    items.push(...(json.items ?? []));
    pageToken = json.nextPageToken;
  } while (pageToken);

  return items.filter((item) => item.status !== "cancelled");
}

type GoogleEventWriteBody = {
  summary: string;
  description?: string;
  location?: string;
  start: { date?: string; dateTime?: string; timeZone?: string };
  end: { date?: string; dateTime?: string; timeZone?: string };
};

function padDate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildGoogleEventWriteBody(
  event: Pick<
    MEvent,
    "title" | "start" | "end" | "allDay" | "notes" | "location" | "timezone"
  >
): GoogleEventWriteBody {
  const body: GoogleEventWriteBody = {
    summary: event.title,
    description: event.notes,
    location: event.location,
    start: {},
    end: {},
  };

  if (event.allDay) {
    const start = new Date(event.start);
    const endExclusive = new Date(event.end);
    body.start = { date: padDate(start) };
    body.end = { date: padDate(endExclusive) };
    return body;
  }

  body.start = {
    dateTime: event.start,
    timeZone: event.timezone,
  };
  body.end = {
    dateTime: event.end,
    timeZone: event.timezone,
  };
  return body;
}

export async function insertGoogleCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: Pick<
    MEvent,
    "title" | "start" | "end" | "allDay" | "notes" | "location" | "timezone"
  >
): Promise<GoogleEventItem> {
  const encodedCal = encodeURIComponent(calendarId);
  return googleRequest<GoogleEventItem>(
    `${CALENDAR_API}/calendars/${encodedCal}/events`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify(buildGoogleEventWriteBody(event)),
    }
  );
}

export async function updateGoogleCalendarEvent(
  accessToken: string,
  externalCalendarId: string,
  externalEventId: string,
  event: Pick<
    MEvent,
    "title" | "start" | "end" | "allDay" | "notes" | "location" | "timezone"
  >
): Promise<GoogleEventItem> {
  const encodedCal = encodeURIComponent(externalCalendarId);
  const encodedEvent = encodeURIComponent(externalEventId);
  return googleRequest<GoogleEventItem>(
    `${CALENDAR_API}/calendars/${encodedCal}/events/${encodedEvent}`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify(buildGoogleEventWriteBody(event)),
    }
  );
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  externalCalendarId: string,
  externalEventId: string
): Promise<void> {
  const encodedCal = encodeURIComponent(externalCalendarId);
  const encodedEvent = encodeURIComponent(externalEventId);
  await googleRequest<void>(
    `${CALENDAR_API}/calendars/${encodedCal}/events/${encodedEvent}`,
    accessToken,
    { method: "DELETE" }
  );
}

export function mapGoogleEventToMEvent(
  item: GoogleEventItem,
  feed: CalendarFeed,
  account: GoogleAccount
): MEvent | null {
  const startRaw = item.start?.dateTime ?? item.start?.date;
  const endRaw = item.end?.dateTime ?? item.end?.date;
  if (!startRaw || !endRaw || !item.id) return null;

  const allDay = Boolean(item.start?.date && !item.start?.dateTime);

  return {
    id: `google:${feed.id}:${item.id}`,
    externalId: item.id,
    source: "google",
    calendarId: feed.id,
    accountId: account.id,
    title: item.summary?.trim() || "(No title)",
    start: allDay ? `${startRaw}T00:00:00` : startRaw,
    // Google all-day end dates are exclusive (midnight on the day after).
    end: allDay ? `${endRaw}T00:00:00` : endRaw,
    allDay,
    location: item.location,
    notes: item.description,
    color: feed.color,
    timezone: item.start?.timeZone,
  };
}

export async function revokeGoogleToken(token: string): Promise<void> {
  const res = await fetch(
    `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  if (!res.ok && res.status !== 400) {
    const text = await res.text().catch(() => "");
    if (__DEV__) {
      console.warn("[Google OAuth] revoke response:", res.status, text);
    }
  }
}

export async function refreshGoogleAccessToken(
  refreshToken: string,
  clientId?: string
): Promise<{ accessToken: string; expiresIn?: number }> {
  const resolvedClientId = clientId ?? getGoogleOAuthClientId();
  if (!resolvedClientId) {
    throw new Error(
      "Google OAuth client ID is not configured (set platform client IDs in .env)."
    );
  }

  const body = new URLSearchParams({
    client_id: resolvedClientId,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  if (__DEV__) {
    console.log(
      "[Google OAuth] refresh token with client:",
      resolvedClientId.slice(0, 12) + "…"
    );
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to refresh Google token: ${text || res.statusText}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in?: number;
  };

  return {
    accessToken: json.access_token,
    expiresIn: json.expires_in,
  };
}
