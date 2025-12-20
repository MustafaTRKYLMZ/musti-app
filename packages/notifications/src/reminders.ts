import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { ANDROID_CHANNEL_ID } from "./channels";
import type { DailyReminderConfig } from "./types"; // istersen ayrı reminder type çıkarırız

type Owner = "budget" | "bookshelf";

type Schedule =
  | { type: "daily"; hour: number; minute: number }
  | { type: "weekly"; weekday: number; hour: number; minute: number } // 1-7
  | { type: "once"; timestamp: number };

export type CustomReminder = {
  id: string;
  owner: Owner;
  title: string;
  body: string;
  schedule: Schedule;
  // ekstra data: target vs ekleyebilirsin
};

export function buildTrigger(schedule: Schedule): Notifications.NotificationTriggerInput {
  if (schedule.type === "once") {
    return {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(schedule.timestamp),
    };
  }

  if (schedule.type === "daily") {
    // Android: CALENDAR destek yok → DAILY
    if (Platform.OS === "android") {
      return {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: schedule.hour,
        minute: schedule.minute,
      };
    }

    return {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: schedule.hour,
      minute: schedule.minute,
      repeats: true,
    };
  }

  // weekly
  if (Platform.OS === "android") {
    // Çoğu sürümde WEEKLY var; yoksa burada fallback yaparız (aşağı not).
    return {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: schedule.weekday,
      hour: schedule.hour,
      minute: schedule.minute,
    };
  }

  return {
    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
    weekday: schedule.weekday,
    hour: schedule.hour,
    minute: schedule.minute,
    repeats: true,
  };
}

export async function scheduleCustomReminder(rem: CustomReminder) {
  const trigger = buildTrigger(rem.schedule);

  return Notifications.scheduleNotificationAsync({
    content: {
      title: rem.title,
      body: rem.body,
      sound: "default",
      ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : null),
      data: {
        owner: rem.owner,
        reminderId: rem.id,
      },
    },
    trigger,
  });
}

export async function cancelNotificationIds(ids: string[]) {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}
