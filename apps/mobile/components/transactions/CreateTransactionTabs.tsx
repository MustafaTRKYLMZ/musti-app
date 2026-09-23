import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "@musti/core";
import { BaseIcon, MText, colors, spacing, radii, iconSizes } from "@musti/ui-native";

export type CreateTransactionTab = "scan" | "manual";

type Props = {
  value: CreateTransactionTab;
  onChange: (tab: CreateTransactionTab) => void;
};

export function CreateTransactionTabs({ value, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.root} accessibilityRole="tablist">
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: value === "scan" }}
        style={[styles.tab, value === "scan" && styles.tabActive]}
        onPress={() => onChange("scan")}
      >
        <BaseIcon
          name="scan-outline"
          size={iconSizes.md}
          color={value === "scan" ? colors.primary : colors.textSecondary}
        />
        <MText
          variant="bodyStrong"
          color={value === "scan" ? "primary" : "textSecondary"}
        >
          {t("budget.create.tab.scan")}
        </MText>
      </Pressable>

      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: value === "manual" }}
        style={[styles.tab, value === "manual" && styles.tabActive]}
        onPress={() => onChange("manual")}
      >
        <BaseIcon
          name="create-outline"
          size={iconSizes.md}
          color={value === "manual" ? colors.primary : colors.textSecondary}
        />
        <MText
          variant="bodyStrong"
          color={value === "manual" ? "primary" : "textSecondary"}
        >
          {t("budget.create.tab.manual")}
        </MText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceStrong,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  tabActive: {
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
