import React from "react";
import { View } from "react-native";
import Toast from "react-native-root-toast";
import { ensureNotificationPermission } from "@budget/notifications";

import { NotificationReminderSection } from "./NotificationReminderSection";
import { useBookshelfNotificationSettingsStore } from "@/store/bookshelf/useNotificationSettingsStore";

export function BookshelfNotificationsSection() {
  const enabled = useBookshelfNotificationSettingsStore((s) => s.enabled);
  const hour = useBookshelfNotificationSettingsStore((s) => s.hour);
  const minute = useBookshelfNotificationSettingsStore((s) => s.minute);
  const setEnabled = useBookshelfNotificationSettingsStore((s) => s.setEnabled);
  const setTime = useBookshelfNotificationSettingsStore((s) => s.setTime);

  return (
    <View>
      <NotificationReminderSection
        title="Reading reminder"
        description="Get a daily notification at your chosen time."
        enabled={enabled}
        hour={hour}
        minute={minute}
        onToggle={async (v) => {
          if (v) {
            const ok = await ensureNotificationPermission();
            if (!ok) {
              Toast.show("Notifications permission is required.", {
                duration: Toast.durations.SHORT,
              });

              setEnabled(false);
              return;
            }
          }

          setEnabled(v);
        }}
        onTimeChange={async (h, m) => {
          setTime(h, m);
        }}
      />
    </View>
  );
}
