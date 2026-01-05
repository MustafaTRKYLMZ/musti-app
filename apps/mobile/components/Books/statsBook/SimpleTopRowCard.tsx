import React from "react";
import { View, StyleSheet, Pressable } from "react-native";

import { BaseIcon } from "@musti/ui-native";
import { Card, MText, radii, spacing, useTheme } from "@musti/ui-native";
import type { SimpleTopRow } from "./types";

type Props = {
  item: SimpleTopRow;
  onPress: () => void;
};

export function SimpleTopRowCard({ item, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable onPress={onPress}>
      <Card
        style={[
          styles.simpleRowCard,
          { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
        ]}
      >
        <MText variant="bodyStrong" color="textPrimary" numberOfLines={1}>
          {item.bookName}
        </MText>

        <View style={styles.metaRow}>
          <BaseIcon
            name="document-text-outline"
            size={12}
            color={colors.textSecondary}
          />
          <MText variant="caption" color="textSecondary">
            {item.pages} pages
          </MText>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  simpleRowCard: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
    gap: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
