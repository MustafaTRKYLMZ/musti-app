import React from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { MText, colors, spacing, iconSizes, IconButton } from "@musti/ui-native";

type Props = {
  title: string;
  right?: React.ReactNode;
};

export function BudgetSubScreenHeader({ title, right }: Props) {
  return (
    <View style={styles.row}>
      <IconButton
        name="chevron-back"
        size={iconSizes.lg}
        onPress={() => router.replace("/(tabs)/budget")}
      />
      <MText variant="heading3" style={styles.title} numberOfLines={1}>
        {title}
      </MText>
      <View style={styles.right}>{right ?? <View style={styles.spacer} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  title: {
    flex: 1,
  },
  right: {
    minWidth: iconSizes.lg + spacing.xs * 2,
    alignItems: "flex-end",
  },
  spacer: {
    width: iconSizes.lg,
  },
});
