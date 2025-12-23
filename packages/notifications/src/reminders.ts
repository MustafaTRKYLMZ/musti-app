import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { ANDROID_CHANNEL_ID } from "./channels";
import type { DailyReminderConfig, NotificationOwner, NotificationPayload } from "./types";

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

/**
 * ✅ Backwards-compatible daily reminder scheduler
 * - Cancels previous reminders for same owner (so UI doesn't duplicate)
 * - Supports payload for deep link routing (content.data.payload)
 */
export async function scheduleDailyReminder(
  cfg: DailyReminderConfig & { payload?: NotificationPayload }
) {
  // Keep old behavior: one daily reminder per owner
  await cancelScheduledByOwner(cfg.owner);

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
      data: {
        owner: cfg.owner,
        kind: cfg.kind ?? "daily",
        payload: cfg.payload ?? { v: 1, kind: "generic" },
      },
    },
    trigger,
  });
}
