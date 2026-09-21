import React from "react";
import { View, StyleSheet } from "react-native";
import { spacing } from "@musti/ui-native";
import { HeaderIconButton } from "./HeaderIconButton";

interface Props {
  onOpenSimulation: () => void;
}

export function BudgetHeader({ onOpenSimulation }: Props) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.rightContainer}>
        <HeaderIconButton
          icon="flask-outline"
          accessibilityLabel="Open simulation"
          onPress={onOpenSimulation}
        />
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
    gap: spacing.sm,
  },
});
