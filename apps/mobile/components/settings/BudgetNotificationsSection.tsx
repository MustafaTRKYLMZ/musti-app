import React from "react";
import { View } from "react-native";
import Toast from "react-native-root-toast";
import { ensureNotificationPermission } from "@budget/notifications";

import { NotificationReminderSection } from "./NotificationReminderSection";
import { useBudgetNotificationSettingsStore } from "@/store/budget/notification/useNotificationSettingsStore";

export function BudgetNotificationsSection() {
  const enabled = useBudgetNotificationSettingsStore((s) => s.enabled);
  const hour = useBudgetNotificationSettingsStore((s) => s.hour);
  const minute = useBudgetNotificationSettingsStore((s) => s.minute);
  const setEnabled = useBudgetNotificationSettingsStore((s) => s.setEnabled);
  const setTime = useBudgetNotificationSettingsStore((s) => s.setTime);

  return (
    <View>
      <NotificationReminderSection
        title="Bütçe hatırlatıcısı"
        description="Her gün seçtiğin saatte bütçeni kontrol etmeni hatırlatır."
        enabled={enabled}
        hour={hour}
        minute={minute}
        onToggle={async (v) => {
          if (v) {
            const ok = await ensureNotificationPermission();
            if (!ok) {
              Toast.show(
                "Bildirim izni gerekiyor. Ayarlardan izin verebilirsin.",
                {
                  duration: Toast.durations.SHORT,
                }
              );

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
