import type { CalendarFeed } from "@musti/planner";

type GoogleApiError = Error & { status?: number; body?: string };

export const GOOGLE_CALENDAR_WRITE_SCOPE =
  "https://www.googleapis.com/auth/calendar";

export function tokenHasCalendarWriteScope(scope?: string): boolean {
  if (!scope) return false;
  return scope.split(/\s+/).includes(GOOGLE_CALENDAR_WRITE_SCOPE);
}

export async function fetchGoogleTokenScopes(
  accessToken: string
): Promise<string | null> {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
  );
  const json = (await res.json()) as {
    scope?: string;
    error?: string;
  };
  if (json.error) return null;
  return json.scope ?? null;
}

export function calendarWriteScopeError(): Error {
  return new Error(
    "Google is connected with read-only access. Disconnect in Settings, then connect again and allow calendar editing."
  );
}

export async function assertGoogleCalendarWriteScope(
  accessToken: string,
  context: string
): Promise<void> {
  await debugLogGoogleToken(accessToken, context);
  const scopes = await fetchGoogleTokenScopes(accessToken);
  if (!tokenHasCalendarWriteScope(scopes ?? undefined)) {
    if (__DEV__) {
      console.error(
        `[Google OAuth] ${context}: missing ${GOOGLE_CALENDAR_WRITE_SCOPE}. Got:`,
        scopes
      );
    }
    throw calendarWriteScopeError();
  }
}

export function isGoogleInsufficientScopeError(err: unknown): boolean {
  const e = err as GoogleApiError;
  if (e.status !== 403) return false;
  const haystack = `${e.message}\n${e.body ?? ""}`;
  return /insufficient.*scope|ACCESS_TOKEN_SCOPE_INSUFFICIENT|insufficientPermissions/i.test(
    haystack
  );
}

export async function debugLogGoogleToken(
  accessToken: string,
  context: string
): Promise<void> {
  if (!__DEV__) return;
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
    );
    const json = (await res.json()) as {
      scope?: string;
      expires_in?: string;
      error?: string;
      error_description?: string;
    };
    if (json.error) {
      console.warn(`[Google OAuth] ${context} tokeninfo:`, json.error, json.error_description);
      return;
    }
    console.log(`[Google OAuth] ${context} scopes:`, json.scope ?? "(none)");
    console.log(`[Google OAuth] ${context} expires_in:`, json.expires_in);
  } catch (err) {
    console.warn(`[Google OAuth] ${context} tokeninfo failed:`, err);
  }
}

export function logGoogleMutationStart(
  operation: "create" | "update" | "delete",
  feed: CalendarFeed,
  extra?: Record<string, unknown>
): void {
  if (!__DEV__) return;
  console.log(`[Google Calendar] ${operation} →`, {
    feed: feed.name,
    feedId: feed.id,
    externalCalendarId: feed.externalCalendarId,
    isPrimary: feed.isPrimary,
    accessRole: feed.accessRole,
    enabled: feed.enabled,
    ...extra,
  });
}

export function logGoogleApiFailure(
  operation: string,
  details: Record<string, unknown>,
  err: unknown
): void {
  const e = err as GoogleApiError;
  console.error(`[Google Calendar] ${operation} FAILED`, {
    ...details,
    status: e.status,
    message: e.message,
    body: e.body,
  });
}
