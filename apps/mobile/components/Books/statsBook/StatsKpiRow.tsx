import React from "react";
import { View, StyleSheet } from "react-native";

import { BaseIcon } from "@musti/ui-native";
import { Card, MText, radii, spacing, useTheme } from "@musti/ui-native";
import { useTranslation } from "@musti/core";

type Props = {
  weekTotal: number;
  monthTotal: number;
};

export function StatsKpiRow({ weekTotal, monthTotal }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.grid2}>
      <Card
        style={[
          styles.kpiCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.kpiTop}>
          <BaseIcon
            name="time-outline"
            color={colors.textSecondary}
          />
          <MText variant="bodyStrong" color="textPrimary">
            {t("bookshelf.stats.last7Days")}
          </MText>
        </View>
        <MText
          variant="heading3"
          color="textPrimary"
          style={{ fontWeight: "900", marginTop: spacing.xs }}
        >
          {weekTotal}
        </MText>
        <MText variant="caption" color="textSecondary">
          {t("bookshelf.stats.pages")}
        </MText>
      </Card>

      <Card
        style={[
          styles.kpiCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.kpiTop}>
          <BaseIcon
            name="calendar-outline"
            color={colors.textSecondary}
          />
          <MText variant="bodyStrong" color="textPrimary">
            {t("bookshelf.stats.last30Days")}
          </MText>
        </View>
        <MText
          variant="heading3"
          color="textPrimary"
          style={{ fontWeight: "900", marginTop: spacing.xs }}
        >
          {monthTotal}
        </MText>
        <MText variant="caption" color="textSecondary">
          {t("bookshelf.stats.pages")}
        </MText>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  grid2: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  kpiCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  kpiTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
