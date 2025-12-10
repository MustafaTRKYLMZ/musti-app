// apps/mobile/components/ui/CashflowRow.tsx
import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { LocalizedDateText } from "@budget/core";
import { MText, colors, spacing, radii } from "@budget/ui-native";
import { BaseIcon, IconButton } from "@/components/ui/AppIcon";

export interface CashflowRowProps {
  title: string;
  type: "Income" | "Expense";
  amount: number;
  date?: string;
  category?: string;
  isFixed?: boolean;
  planId?: string | number;
  onPress?: () => void;
  onDelete?: () => void;
  multiplier?: number;
}

export const CashflowRow: React.FC<CashflowRowProps> = ({
  title,
  type,
  amount,
  date,
  category,
  isFixed,
  onPress,
  onDelete,
  multiplier,
}) => {
  const isIncome = type === "Income";
  const isExpense = type === "Expense";

  const amountColor = isIncome ? colors.success : colors.danger;
  const arrowIconName = isIncome ? "arrow-up" : "arrow-down";

  const statusIconName = isFixed ? "repeat" : undefined;
  const statusIconColor = isFixed ? colors.primaryLight : colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {/* LEFT */}
      <View style={styles.leftCol}>
        <MText variant="bodyStrong" color="textPrimary" numberOfLines={1}>
          {title}
        </MText>

        <View style={styles.metaRow}>
          {date && (
            <LocalizedDateText date={date} shortMonth style={styles.dateText} />
          )}

          {statusIconName && (
            <BaseIcon name={statusIconName} size={13} color={statusIconColor} />
          )}

          {category && (
            <MText variant="caption" color="textMuted" numberOfLines={1}>
              {category}
            </MText>
          )}
        </View>
      </View>

      {/* RIGHT */}
      <View style={styles.rightCol}>
        <View style={styles.amountRow}>
          {/* Arrow icon → BaseIcon */}
          <BaseIcon name={arrowIconName} size={16} color={amountColor} />

          <MText
            variant="bodyStrong"
            color={isIncome ? "success" : "danger"}
            style={styles.amount}
          >
            {isExpense && "-"}
            {Math.abs(amount).toFixed(2)} €
          </MText>

          {multiplier && multiplier > 1 && (
            <View style={styles.multiplierPill}>
              <MText variant="caption" color="textMuted">
                ×{multiplier}
              </MText>
            </View>
          )}
        </View>

        {onDelete && (
          <IconButton
            onPress={onDelete}
            name="trash-outline"
            size={18}
            color={colors.danger}
            style={styles.iconButton}
          />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  rowPressed: {
    opacity: 0.8,
  },
  leftCol: {
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    gap: 6,
  },
  dateText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  rightCol: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.md,
  },
  amount: {
    fontSize: 14,
    fontWeight: "600",
  },
  multiplierPill: {
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  iconButton: {
    paddingHorizontal: spacing.md,
  },
});
