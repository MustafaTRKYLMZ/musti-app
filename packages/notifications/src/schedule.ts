import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { ANDROID_CHANNEL_ID } from "./channels";
import type { DailyReminderConfig, NotificationOwner } from "./types";

export async function listScheduled() {
  return Notifications.getAllScheduledNotificationsAsync();
}

export async function cancelScheduledByOwner(owner: NotificationOwner) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  const toCancel = scheduled
    .filter((n) => (n.content?.data as any)?.owner === owner)
    .map((n) => n.identifier);

  await Promise.all(
    toCancel.map((id) => Notifications.cancelScheduledNotificationAsync(id))
  );
}

export async function scheduleDailyReminder(cfg: DailyReminderConfig) {
  const trigger: Notifications.NotificationTriggerInput =
    Platform.OS === "android"
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: cfg.hour,
          minute: cfg.minute,
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: cfg.hour,
          minute: cfg.minute,
          repeats: true,
        };

  return Notifications.scheduleNotificationAsync({
    content: {
      title: cfg.title,
      body: cfg.body,
      sound: "default",
      ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : null),
      data: { owner: cfg.owner, kind: cfg.kind ?? "daily" },
    },
    trigger,
  });
}
