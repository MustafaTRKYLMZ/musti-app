import { useTranslation } from "@budget/core";
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { MText, colors, spacing, radii } from "@budget/ui-native";

export type ViewTab = "all" | "fixed" | "income" | "expense";

interface Props {
  active: ViewTab;
  onChange: (tab: ViewTab) => void;
}

interface TabChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function TabChip({ label, active, onPress }: TabChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tabChip, active && styles.tabChipActive]}
    >
      <MText
        variant="bodyStrong"
        color={active ? "textInverse" : "textSecondary"}
      >
        {label}
      </MText>
    </TouchableOpacity>
  );
}

export function ViewTabs({ active, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.tabsRow}>
      <TabChip
        label={t("all")}
        active={active === "all"}
        onPress={() => onChange("all")}
      />
      <TabChip
        label={t("fixed")}
        active={active === "fixed"}
        onPress={() => onChange("fixed")}
      />
      <TabChip
        label={t("income")}
        active={active === "income"}
        onPress={() => onChange("income")}
      />
      <TabChip
        label={t("expense")}
        active={active === "expense"}
        onPress={() => onChange("expense")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabsRow: {
    flexDirection: "row",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  tabChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  tabChipActive: {
    backgroundColor: colors.success,
  },
});
