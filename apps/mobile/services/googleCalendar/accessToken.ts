import {
  loadGoogleTokens,
  saveGoogleTokens,
  type StoredGoogleTokens,
} from "./tokenStorage";
import { refreshGoogleAccessToken } from "./googleCalendarApi";

export async function getValidGoogleAccessToken(
  accountId: string
): Promise<string | null> {
  const stored = await loadGoogleTokens(accountId);
  if (!stored?.accessToken) return null;

  const stillValid =
    !stored.expiresAt || stored.expiresAt > Date.now() + 60_000;

  if (stillValid) {
    return stored.accessToken;
  }

  if (!stored.refreshToken) {
    return null;
  }

  const refreshed = await refreshGoogleAccessToken(stored.refreshToken);
  const next: StoredGoogleTokens = {
    accessToken: refreshed.accessToken,
    refreshToken: stored.refreshToken,
    expiresAt: refreshed.expiresIn
      ? Date.now() + refreshed.expiresIn * 1000
      : undefined,
  };
  await saveGoogleTokens(accountId, next);
  return next.accessToken;
}

export async function storeGoogleAuthResult(
  accountId: string,
  params: {
    accessToken?: string | null;
    refreshToken?: string | null;
    expiresIn?: number | null;
  }
): Promise<void> {
  if (!params.accessToken) {
    throw new Error("Google sign-in did not return an access token.");
  }

  await saveGoogleTokens(accountId, {
    accessToken: params.accessToken,
    refreshToken: params.refreshToken ?? undefined,
    expiresAt: params.expiresIn
      ? Date.now() + params.expiresIn * 1000
      : undefined,
  });
}
