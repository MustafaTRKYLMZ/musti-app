import {
  deleteGoogleTokens,
  loadGoogleTokens,
  saveGoogleTokens,
  type StoredGoogleTokens,
} from "./tokenStorage";
import { refreshGoogleAccessToken, revokeGoogleToken } from "./googleCalendarApi";

export async function revokeAndDeleteGoogleTokens(
  accountId: string
): Promise<void> {
  const stored = await loadGoogleTokens(accountId);
  const token = stored?.refreshToken ?? stored?.accessToken;
  if (token) {
    try {
      await revokeGoogleToken(token);
      if (__DEV__) {
        console.log("[Google OAuth] revoked tokens for account", accountId);
      }
    } catch (err) {
      if (__DEV__) {
        console.warn("[Google OAuth] revoke failed:", err);
      }
    }
  }
  await deleteGoogleTokens(accountId);
}

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

  try {
    const refreshed = await refreshGoogleAccessToken(
      stored.refreshToken,
      stored.tokenClientId
    );
    const next: StoredGoogleTokens = {
      accessToken: refreshed.accessToken,
      refreshToken: stored.refreshToken,
      tokenClientId: stored.tokenClientId,
      expiresAt: refreshed.expiresIn
        ? Date.now() + refreshed.expiresIn * 1000
        : undefined,
    };
    await saveGoogleTokens(accountId, next);
    return next.accessToken;
  } catch (err) {
    if (__DEV__) {
      console.warn("[Google OAuth] refresh failed — reconnect Google:", err);
    }
    return null;
  }
}

export async function storeGoogleAuthResult(
  accountId: string,
  params: {
    accessToken?: string | null;
    refreshToken?: string | null;
    expiresIn?: number | null;
    tokenClientId?: string | null;
  }
): Promise<void> {
  if (!params.accessToken) {
    throw new Error("Google sign-in did not return an access token.");
  }

  await saveGoogleTokens(accountId, {
    accessToken: params.accessToken,
    refreshToken: params.refreshToken ?? undefined,
    tokenClientId: params.tokenClientId ?? undefined,
    expiresAt: params.expiresIn
      ? Date.now() + params.expiresIn * 1000
      : undefined,
  });
}
