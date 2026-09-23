import React from "react";
import { View } from "react-native";

import { ensureNotificationPermission } from "@musti/notifications";
import { spacing } from "@musti/ui-native";
import { useTranslation } from "@musti/core";
import Toast from "react-native-root-toast";

import { NotificationReminderSection } from "./NotificationReminderSection";
import { useBookshelfNotificationSettingsStore } from "@/store/bookshelf/useNotificationSettingsStore";

export function BookshelfNotificationsSection() {
  const { t } = useTranslation();

  const enabled = useBookshelfNotificationSettingsStore((s) => s.enabled);
  const hour = useBookshelfNotificationSettingsStore((s) => s.hour);
  const minute = useBookshelfNotificationSettingsStore((s) => s.minute);
  const setEnabled = useBookshelfNotificationSettingsStore((s) => s.setEnabled);
  const setTime = useBookshelfNotificationSettingsStore((s) => s.setTime);

  const requirePerm = async () => {
    const ok = await ensureNotificationPermission();
    if (!ok) {
      Toast.show(t("bookshelf.notifications.permissionRequired"), {
        duration: Toast.durations.SHORT,
      });
    }
    return ok;
  };

  return (
    <View>
      <NotificationReminderSection
        variant="embedded"
        title={t("bookshelf.notifications.readingReminder")}
        description={t("bookshelf.notifications.readingReminderDesc")}
        enabled={enabled}
        hour={hour}
        minute={minute}
        onToggle={async (v) => {
          if (v) {
            const ok = await requirePerm();
            if (!ok) {
              setEnabled(false);
              return;
            }
            setEnabled(true);
            return;
          }
          setEnabled(false);
        }}
        onTimeChange={async (h, m) => {
          setTime(h, m);
        }}
      />

    </View>
  );
}
