import React from "react";
import { View, StyleSheet } from "react-native";
import { MText, spacing } from "@musti/ui-native";

type Props = {
  count: number;
  title?: string;
};

export function Last30DaysHeader({
  count,
  title = "Last 30 days · daily (excluding today)",
}: Props) {
  return (
    <View style={styles.sectionHeader}>
      <MText variant="bodyStrong" color="textPrimary">
        {title}
      </MText>
      <MText variant="caption" color="textSecondary">
        {count}
      </MText>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
});
