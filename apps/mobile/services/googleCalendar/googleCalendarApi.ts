import type { CalendarFeed, GoogleAccount, MEvent } from "@musti/planner";

type GoogleCalendarListItem = {
  id: string;
  summary?: string;
  backgroundColor?: string;
  primary?: boolean;
  accessRole?: string;
};

type GoogleEventItem = {
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

async function googleFetch<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Google Calendar API error (${res.status}): ${body || res.statusText}`
    );
  }

  return res.json() as Promise<T>;
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
    const qs = new URLSearchParams({ minAccessRole: "reader" });
    if (pageToken) qs.set("pageToken", pageToken);

    const json = await googleFetch<{
      items?: GoogleCalendarListItem[];
      nextPageToken?: string;
    }>(`${CALENDAR_API}/users/me/calendarList?${qs.toString()}`, accessToken);

    items.push(...(json.items ?? []));
    pageToken = json.nextPageToken;
  } while (pageToken);

  return items;
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
    end: allDay ? `${endRaw}T23:59:59` : endRaw,
    allDay,
    location: item.location,
    notes: item.description,
    color: feed.color,
    timezone: item.start?.timeZone,
  };
}

export async function refreshGoogleAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresIn?: number }> {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!clientId) {
    throw new Error("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not configured.");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

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
