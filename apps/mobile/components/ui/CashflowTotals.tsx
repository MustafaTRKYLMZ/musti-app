// apps/mobile/components/ui/CashflowTotals.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { MText, colors, spacing, radii } from "@musti/ui-native";

interface CashflowTotalsProps {
  income: number;
  expense: number;
  incomeLabel?: string;
  expenseLabel?: string;
  netLabel?: string;
}

export const CashflowTotals: React.FC<CashflowTotalsProps> = ({
  income,
  expense,
  incomeLabel = "Income (all)",
  expenseLabel = "Expense (all)",
  netLabel = "Balance (all)",
}) => {
  const net = income - expense;

  const netColorKey: keyof typeof colors =
    net > 0 ? "success" : net < 0 ? "danger" : "textSecondary";

  return (
    <View style={styles.container}>
      <View style={styles.column}>
        <MText variant="caption" color="textSecondary">
          {incomeLabel}
        </MText>
        <MText variant="bodyStrong" color="success">
          {income.toFixed(2)} €
        </MText>
      </View>

      <View style={styles.column}>
        <MText variant="caption" color="textSecondary">
          {expenseLabel}
        </MText>
        <MText variant="bodyStrong" color="danger">
          {expense.toFixed(2)} €
        </MText>
      </View>

      <View style={styles.column}>
        <MText variant="caption" color="textSecondary">
          {netLabel}
        </MText>
        <MText variant="bodyStrong" color={netColorKey}>
          {net >= 0 ? "+" : ""}
          {net.toFixed(2)} €
        </MText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  column: {
    flex: 1,
    marginRight: spacing.sm,
  },
});
