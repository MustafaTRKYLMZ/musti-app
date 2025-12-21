import React from "react";
import { View, StyleSheet } from "react-native";

import { BaseIcon } from "@/components/ui/AppIcon";
import { Card, MText, radii, spacing, useTheme } from "@budget/ui-native";

type ModePart = { mode: string; value: number; icon: string; label: string };

type Props = {
  today: string;
  todayTotal: number;
  modeParts: ModePart[];
};

export function TodaySummaryCard({ today, todayTotal, modeParts }: Props) {
  const { colors } = useTheme();

  return (
    <Card
      style={[
        styles.summaryCard,
        { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
      ]}
    >
      <View style={styles.summaryTitleRow}>
        <BaseIcon name="today-outline" size={16} color={colors.textSecondary} />
        <MText variant="bodyStrong" color="textPrimary">
          Today
        </MText>
        <MText
          variant="caption"
          color="textSecondary"
          style={{ marginLeft: "auto" }}
        >
          {today}
        </MText>
      </View>

      <MText
        variant="heading2"
        color="textPrimary"
        style={{ marginTop: spacing.xs, fontWeight: "900" }}
      >
        {todayTotal} pages
      </MText>

      {modeParts.length > 0 ? (
        <View style={styles.modeBreakdown}>
          {modeParts.map((p) => (
            <View
              key={p.mode}
              style={[
                styles.modeBreakdownItem,
                {
                  backgroundColor: colors.surfaceStrong,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <BaseIcon
                name={p.icon as any}
                size={14}
                color={colors.textSecondary}
              />
              <MText variant="caption" color="textSecondary">
                {p.label}:
              </MText>
              <MText
                variant="caption"
                color="textPrimary"
                style={{ fontWeight: "900" }}
              >
                {p.value}
              </MText>
            </View>
          ))}
        </View>
      ) : (
        <MText
          variant="caption"
          color="textSecondary"
          style={{ marginTop: spacing.sm }}
        >
          No pages tracked today yet.
        </MText>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  modeBreakdown: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  modeBreakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
  },
});
