import React from "react";
import { StyleSheet } from "react-native";
import { Card, MText, radii, spacing, useTheme } from "@musti/ui-native";

type Props = { message: string };

export function EmptyStateCard({ message }: Props) {
  const { colors } = useTheme();

  return (
    <Card
      style={[
        styles.emptyCard,
        { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
      ]}
    >
      <MText variant="body" color="textSecondary">
        {message}
      </MText>
    </Card>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
});
