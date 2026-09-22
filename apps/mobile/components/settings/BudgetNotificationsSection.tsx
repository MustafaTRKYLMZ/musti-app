import React from "react";
import { View, StyleSheet } from "react-native";
import Toast from "react-native-root-toast";
import { ensureNotificationPermission } from "@musti/notifications";
import { useTranslation } from "@musti/core";
import { spacing } from "@musti/ui-native";
import { NotificationReminderSection } from "./NotificationReminderSection";
import { PriceAlertSettingsSection } from "./PriceAlertSettingsSection";
import { useBudgetNotificationSettingsStore } from "@/store/budget/notification/useNotificationSettingsStore";

export function BudgetNotificationsSection() {
  const { t } = useTranslation();
  const enabled = useBudgetNotificationSettingsStore((s) => s.enabled);
  const hour = useBudgetNotificationSettingsStore((s) => s.hour);
  const minute = useBudgetNotificationSettingsStore((s) => s.minute);
  const setEnabled = useBudgetNotificationSettingsStore((s) => s.setEnabled);
  const setTime = useBudgetNotificationSettingsStore((s) => s.setTime);

  return (
    <View style={styles.wrap}>
      <NotificationReminderSection
        title={t("budget.reminders.dailyTitle")}
        description={t("budget.reminders.dailyDesc")}
        enabled={enabled}
        hour={hour}
        minute={minute}
        onToggle={async (v) => {
          if (v) {
            const ok = await ensureNotificationPermission();
            if (!ok) {
              Toast.show(t("priceAlerts.permissionRequired"), {
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
      <PriceAlertSettingsSection />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
});
