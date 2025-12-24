// utils/debugNotifications.ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { ANDROID_CHANNEL_ID, type NotificationPayload } from "@budget/notifications";

async function scheduleTest(payload: NotificationPayload, title: string) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: "Tap to test deep link",
      sound: "default",
      ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : null),
      data: { payload },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      repeats: false,
    },
  });
}

export function fireTestNotificationGeneric() {
  const payload: NotificationPayload = { v: 1, kind: "generic" };
  return scheduleTest(payload, "Test: Generic");
}

export function fireTestLinkReminders(owner: "bookshelf" | "budget") {
  const payload: NotificationPayload = {
    v: 1,
    link: { kind: "reminders", owner } as any,
  };
  return scheduleTest(payload, "Test link: Reminders");
}

export function fireTestLinkBook(bookUri: string, bookName?: string) {
  const payload: NotificationPayload = {
    v: 1,
    link: { kind: "normal", bookUri, bookName },
  };
  return scheduleTest(payload, "Test link: Book");
}

export function fireTestLinkPlan(planId: string, bookUri: string, bookName?: string) {
  const payload: NotificationPayload = {
    v: 1,
    link: { kind: "plan", planId, bookUri, bookName },
  };
  return scheduleTest(payload, "Test link: Plan");
}

export function fireTestLinkTarget(targetId: string) {
  const payload: NotificationPayload = {
    v: 1,
    link: { kind: "target", targetId },
  };
  return scheduleTest(payload, "Test link: Target");
}
