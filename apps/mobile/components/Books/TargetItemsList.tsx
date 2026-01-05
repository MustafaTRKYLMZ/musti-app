import React from "react";
import { View, StyleSheet } from "react-native";
import { MText, spacing, radii, iconSizes, useTheme } from "@musti/ui-native";
import { IconButton } from "@musti/ui-native";
import { TargetItemSummary } from "./TargetItemSummary";
import { TargetItem } from "@musti/core";

type TargetItemsListProps = {
  items: TargetItem[];
  onDeleteItem: (itemId: string) => void;
};

export const TargetItemsList = ({
  items,
  onDeleteItem,
}: TargetItemsListProps) => {
  const { colors } = useTheme();

  if (!items.length) return null;

  return (
    <>
      <MText style={styles.title}>Items ({items.length})</MText>

      <View
        style={[
          styles.box,
          {
            borderColor: colors.borderSubtle,
            backgroundColor: colors.surface,
          },
        ]}
      >
        {items.map((it) => (
          <View
            key={it.id}
            style={[styles.row, { borderBottomColor: colors.borderSubtle }]}
          >
            <View style={{ flex: 1 }}>
              <TargetItemSummary item={it} variant="compact" />
            </View>

            <IconButton
              name="trash-outline"
              size={iconSizes.md}
              color={colors.textPrimary}
              onPress={() => onDeleteItem(it.id)}
            />
          </View>
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    fontWeight: "800",
    opacity: 0.85,
  },
  box: {
    borderWidth: 1,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bookName: {
    fontWeight: "800",
  },
  sub: {
    opacity: 0.75,
    marginTop: 2,
  },
});
