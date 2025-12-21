import React from "react";
import { View, StyleSheet } from "react-native";

import { BaseIcon } from "@/components/ui/AppIcon";
import { Card, MText, radii, spacing, useTheme } from "@budget/ui-native";

type Props = {
  icon: string;
  title: string;
  total: number;
  subtitle: string;

  topTitle: string;
  topCount: number;

  children: React.ReactNode;
};

export function PeriodCard({
  icon,
  title,
  total,
  subtitle,
  topTitle,
  topCount,
  children,
}: Props) {
  const { colors } = useTheme();

  return (
    <Card
      style={[
        styles.periodCard,
        { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
      ]}
    >
      <View style={styles.periodHeader}>
        <View style={styles.periodHeaderLeft}>
          <BaseIcon name={icon as any} size={16} color={colors.textSecondary} />
          <MText variant="bodyStrong" color="textPrimary">
            {title}
          </MText>
        </View>

        <MText
          variant="bodyStrong"
          color="textPrimary"
          style={{ fontWeight: "900" }}
        >
          {total}
        </MText>
      </View>

      <MText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
        {subtitle}
      </MText>

      <View style={styles.periodTopHeader}>
        <MText variant="bodyStrong" color="textPrimary">
          {topTitle}
        </MText>
        <MText variant="caption" color="textSecondary">
          {topCount}
        </MText>
      </View>

      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  periodCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  periodHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  periodHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  periodTopHeader: {
    marginTop: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
});
