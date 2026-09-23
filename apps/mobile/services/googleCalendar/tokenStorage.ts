import * as SecureStore from "expo-secure-store";

export type StoredGoogleTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  /** OAuth client_id that issued the refresh token (iOS/Android on mobile). */
  tokenClientId?: string;
};

const keyFor = (accountId: string) => `google_cal_tokens_${accountId}`;

export async function saveGoogleTokens(
  accountId: string,
  tokens: StoredGoogleTokens
): Promise<void> {
  await SecureStore.setItemAsync(keyFor(accountId), JSON.stringify(tokens));
}

export async function loadGoogleTokens(
  accountId: string
): Promise<StoredGoogleTokens | null> {
  const raw = await SecureStore.getItemAsync(keyFor(accountId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredGoogleTokens;
  } catch {
    return null;
  }
}

export async function deleteGoogleTokens(accountId: string): Promise<void> {
  await SecureStore.deleteItemAsync(keyFor(accountId));
}
