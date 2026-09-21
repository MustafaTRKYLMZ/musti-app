import { Platform } from "react-native";

export const GOOGLE_CALENDAR_SCOPES = [
  "openid",
  "profile",
  "email",
  "https://www.googleapis.com/auth/calendar.readonly",
];

export const googleCalendarConfig = {
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "",
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "",
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
};

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
