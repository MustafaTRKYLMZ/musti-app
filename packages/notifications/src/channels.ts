import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const ANDROID_CHANNEL_ID = "reading-reminders";

export async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Reading reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
    enableVibrate: true,
  });
}
