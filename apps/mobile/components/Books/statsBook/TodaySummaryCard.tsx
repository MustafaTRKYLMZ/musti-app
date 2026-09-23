import React from "react";
import { View, StyleSheet } from "react-native";

import { BaseIcon } from "@musti/ui-native";
import { Card, MText, radii, spacing, useTheme } from "@musti/ui-native";
import { useTranslation, formatTranslation, type TranslationKey } from "@musti/core";

type ModePart = {
  mode: string;
  value: number;
  icon: string;
  labelKey: TranslationKey;
};

type Props = {
  today: string;
  todayTotal: number;
  modeParts: ModePart[];

  todayMinutes?: number;
};

export function TodaySummaryCard({
  today,
  todayTotal,
  modeParts,
  todayMinutes,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const minsSafe =
    typeof todayMinutes === "number" && Number.isFinite(todayMinutes)
      ? Math.max(0, Math.floor(todayMinutes))
      : 0;

  const todayMeta =
    minsSafe > 0
      ? `${today} · ${formatTranslation(t("bookshelf.common.minCount"), {
          count: minsSafe,
        })}`
      : today;

  const todayTotalLabel =
    minsSafe > 0
      ? `${formatTranslation(t("bookshelf.common.pagesCount"), {
          count: todayTotal,
        })} · ${formatTranslation(t("bookshelf.common.minCount"), {
          count: minsSafe,
        })}`
      : formatTranslation(t("bookshelf.common.pagesCount"), {
          count: todayTotal,
        });

  return (
    <Card
      style={[
        styles.summaryCard,
        { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
      ]}
    >
      <View style={styles.summaryTitleRow}>
        <BaseIcon name="today-outline" color={colors.textSecondary} />
        <MText variant="bodyStrong" color="textPrimary">
          {t("bookshelf.stats.today")}
        </MText>

        <MText
          variant="caption"
          color="textSecondary"
          style={{ marginLeft: "auto" }}
        >
          {todayMeta}
        </MText>
      </View>

      <MText
        variant="heading2"
        color="textPrimary"
        style={{ marginTop: spacing.xs, fontWeight: "900" }}
      >
        {todayTotalLabel}
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
                color={colors.textSecondary}
              />
              <MText variant="caption" color="textSecondary">
                {t(p.labelKey)}:
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
          {t("bookshelf.stats.noPagesToday")}
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
