import Constants from "expo-constants";
import { Platform } from "react-native";

// openid + profile + email are added automatically by expo-auth-session's Google provider.
export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
];

export const googleCalendarConfig = {
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "",
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "",
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
};

export function getExpoGoogleRedirectUri(): string {
  const owner = Constants.expoConfig?.owner ?? "mustafa123_1";
  const slug = Constants.expoConfig?.slug ?? "mobile";
  return `https://auth.expo.io/@${owner}/${slug}`;
}

function getReverseClientRedirectUri(clientId: string): string {
  const idPart = clientId.replace(/\.apps\.googleusercontent\.com$/, "");
  return `com.googleusercontent.apps.${idPart}:/oauthredirect`;
}

export function isGoogleCalendarConfigured(): boolean {
  if (!googleCalendarConfig.webClientId) return false;
  if (Platform.OS === "android" && !googleCalendarConfig.androidClientId) {
    return false;
  }
  if (Platform.OS === "ios" && !googleCalendarConfig.iosClientId) {
    return false;
  }
  return true;
}

/**
 * OAuth params per platform.
 * Android/iOS dev builds must use native redirect URIs — auth.expo.io is blocked
 * by Google for sensitive scopes (Calendar) because Expo is not verified for them.
 */
export function getGoogleAuthRequestParams(): {
  webClientId: string;
  androidClientId?: string;
  iosClientId?: string;
  redirectUri: string;
} {
  const webClientId = googleCalendarConfig.webClientId;

  if (Platform.OS === "android") {
    const androidClientId = googleCalendarConfig.androidClientId;
    return {
      webClientId,
      androidClientId,
      redirectUri: getReverseClientRedirectUri(androidClientId),
    };
  }

  if (Platform.OS === "ios") {
    const iosClientId = googleCalendarConfig.iosClientId;
    return {
      webClientId,
      iosClientId,
      redirectUri: getReverseClientRedirectUri(iosClientId),
    };
  }

  return {
    webClientId,
    redirectUri: getExpoGoogleRedirectUri(),
  };
}

/**
 * OAuth token refresh must use the native iOS/Android client ID.
 * Web clients require client_secret and must not be used from the app.
 */
export function getGoogleOAuthClientId(): string {
  if (Platform.OS === "android" && googleCalendarConfig.androidClientId) {
    return googleCalendarConfig.androidClientId;
  }
  if (Platform.OS === "ios" && googleCalendarConfig.iosClientId) {
    return googleCalendarConfig.iosClientId;
  }
  return googleCalendarConfig.webClientId;
}

export function googleCalendarSetupMessage(): string {
  if (!googleCalendarConfig.webClientId) {
    return "Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in apps/mobile/.env";
  }
  if (Platform.OS === "android" && !googleCalendarConfig.androidClientId) {
    return "Set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in apps/mobile/.env";
  }
  if (Platform.OS === "ios" && !googleCalendarConfig.iosClientId) {
    return "Set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID in apps/mobile/.env";
  }
  return "";
}
