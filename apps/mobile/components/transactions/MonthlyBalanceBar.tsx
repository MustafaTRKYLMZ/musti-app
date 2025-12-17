import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "@budget/core";
import { MText, colors, radii, spacing } from "@budget/ui-native";

interface Props {
  income: number;
  expense: number;
  net: number;
}

export function MonthlyBalanceBar({ income, expense, net }: Props) {
  const balanceColor: keyof typeof colors =
    net > 0 ? "success" : net < 0 ? "danger" : "textSecondary";

  const { t } = useTranslation();

  return (
    <View style={styles.balanceBar}>
      <View style={styles.balanceColumn}>
        <MText
          variant="caption"
          color="textSecondary"
          style={styles.balanceLabel}
        >
          {t("income")}
        </MText>
        <MText variant="bodyStrong" color="success">
          {income.toFixed(2)} €
        </MText>
      </View>

      <View style={styles.balanceColumn}>
        <MText
          variant="caption"
          color="textSecondary"
          style={styles.balanceLabel}
        >
          {t("expense")}
        </MText>
        <MText variant="bodyStrong" color="danger">
          {expense.toFixed(2)} €
        </MText>
      </View>

      <View style={styles.balanceColumn}>
        <MText
          variant="caption"
          color="textSecondary"
          style={styles.balanceLabel}
        >
          {t("balance_as_month")}
        </MText>
        <MText variant="bodyStrong" color={balanceColor}>
          {net.toFixed(2)} €
        </MText>
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  balanceBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceStrong,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },

  balanceColumn: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },

  balanceLabel: {
    marginBottom: spacing["xs"],
  },
});
