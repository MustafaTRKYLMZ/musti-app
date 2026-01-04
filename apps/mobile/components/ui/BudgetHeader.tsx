// components/ui/BudgetHeader.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import LanguageSelector from "../LanguageSelector";
import { colors, spacing, radii } from "@musti/ui-native";
import { IconButton } from "./AppIcon";

interface Props {
  onOpenSimulation: () => void;
  onLanguageChange?: (msg: string) => void;
}

export function BudgetHeader({ onOpenSimulation, onLanguageChange }: Props) {
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
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  iconRight: {
    borderRadius: radii.full,
  },
});
