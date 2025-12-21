StatsSectionHeader;
import React from "react";
import { View, StyleSheet } from "react-native";
import { MText, spacing } from "@budget/ui-native";

type Props = {
  title: string;
  count: number;
};

export function StatsSectionHeader({ title, count }: Props) {
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
