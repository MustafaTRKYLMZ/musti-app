import React from "react";
import { View, StyleSheet, Switch, Pressable } from "react-native";
import Toast from "react-native-root-toast";
import { useTranslation } from "@musti/core";
import { MText, spacing, radii, useTheme } from "@musti/ui-native";
import { ensureNotificationPermission } from "@musti/notifications";
import { useBudgetNotificationSettingsStore } from "@/store/budget/notification/useNotificationSettingsStore";

export function PriceAlertSettingsSection() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const enabled = useBudgetNotificationSettingsStore((s) => s.priceAlertsEnabled);
  const thresholdPct = useBudgetNotificationSettingsStore(
    (s) => s.priceAlertThresholdPct
  );
  const setEnabled = useBudgetNotificationSettingsStore(
    (s) => s.setPriceAlertsEnabled
  );
  const setThreshold = useBudgetNotificationSettingsStore(
    (s) => s.setPriceAlertThresholdPct
  );

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <MText variant="bodyStrong">{t("priceAlerts.title")}</MText>
          <MText variant="caption" color="textSecondary">
            {t("priceAlerts.description")} ({thresholdPct}%)
          </MText>
        </View>
        <Switch
          value={enabled}
          onValueChange={async (v) => {
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
        />
      </View>

      <View style={styles.thresholdRow}>
        {[3, 5, 10].map((pct) => (
          <Pressable
            key={pct}
            style={[
              styles.chip,
              {
                borderColor:
                  thresholdPct === pct ? colors.primary : colors.borderSubtle,
                backgroundColor:
                  thresholdPct === pct
                    ? "rgba(47,111,237,0.08)"
                    : colors.background,
              },
            ]}
            onPress={() => setThreshold(pct)}
          >
            <MText variant="caption">≥{pct}%</MText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  thresholdRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
