// components/ui/BudgetHeader.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "@budget/core";
import LanguageSelector from "../LanguageSelector";
import { MText, colors, spacing, radii } from "@budget/ui-native";
import { Link } from "expo-router";
import { IconButton } from "./AppIcon";

interface Props {
  onOpenMenu: () => void;
  onOpenSimulation: () => void;
  onLanguageChange?: (msg: string) => void;
}

export function BudgetHeader({
  onOpenMenu,
  onOpenSimulation,
  onLanguageChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.headerRow}>
      {/* RIGHT: simulation + language */}
      <View style={styles.rightContainer}>
        <IconButton
          family="ion"
          name="flask-outline"
          padding={spacing.xs}
          style={styles.iconRight}
          onPress={onOpenSimulation}
        />
        <LanguageSelector onLanguageChange={onLanguageChange} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    width: "100%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    gap: spacing.sm,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  menuButton: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  titleBlock: {
    flexShrink: 1,
  },
  iconRight: {
    borderRadius: radii.full,
  },
});
