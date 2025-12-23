import React from "react";
import { View } from "react-native";
import Toast from "react-native-root-toast";

import {
  ensureNotificationPermission,
  scheduleDailyReminder,
  cancelScheduledByOwner,
  type NotificationPayload,
} from "@budget/notifications";

import { NotificationReminderSection } from "./NotificationReminderSection";
import { useBookshelfNotificationSettingsStore } from "@/store/bookshelf/useNotificationSettingsStore";

const REMINDER_OWNER = "bookshelf" as const;

const buildBookshelfReminderPayload = (): NotificationPayload => ({
  v: 1,
  kind: "generic",
});

export function BookshelfNotificationsSection() {
  const enabled = useBookshelfNotificationSettingsStore((s) => s.enabled);
  const hour = useBookshelfNotificationSettingsStore((s) => s.hour);
  const minute = useBookshelfNotificationSettingsStore((s) => s.minute);
  const setEnabled = useBookshelfNotificationSettingsStore((s) => s.setEnabled);
  const setTime = useBookshelfNotificationSettingsStore((s) => s.setTime);

  const scheduleOrUpdate = async (h: number, m: number) => {
    const payload = buildBookshelfReminderPayload();

    await scheduleDailyReminder({
      owner: REMINDER_OWNER,
      kind: "reading",
      hour: h,
      minute: m,
      title: "Reading reminder",
      body: "Keep your streak alive 📖",
      payload,
    });
  };

  return (
    <View>
      <NotificationReminderSection
        title="Reading reminder"
        description="Get a daily notification at your chosen time."
        enabled={enabled}
        hour={hour}
        minute={minute}
        onToggle={async (v) => {
          try {
            if (v) {
              const ok = await ensureNotificationPermission();
              if (!ok) {
                Toast.show("Notifications permission is required.", {
                  duration: Toast.durations.SHORT,
                });
                setEnabled(false);
                return;
              }

              // ✅ enable + schedule now with payload
              setEnabled(true);
              await scheduleOrUpdate(hour, minute);
              return;
            }

            // ✅ disable + cancel all bookshelf reminders
            setEnabled(false);
            await cancelScheduledByOwner(REMINDER_OWNER);
          } catch {
            Toast.show("Notification settings could not be updated.", {
              duration: Toast.durations.SHORT,
            });
          }
        }}
        onTimeChange={async (h, m) => {
          try {
            setTime(h, m);

            // ✅ if enabled, re-schedule with new time
            if (enabled) {
              await scheduleOrUpdate(h, m);
            }
          } catch {
            Toast.show("Time could not be updated.", {
              duration: Toast.durations.SHORT,
            });
          }
        }}
      />
    </View>
  );
}
