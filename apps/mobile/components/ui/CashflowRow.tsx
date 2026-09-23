import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { MText, colors, spacing, radii } from "@musti/ui-native";
import { BaseIcon, IconButton } from "@musti/ui-native";

export interface CashflowRowProps {
  title: string;
  subtitle?: string;
  leadingIcon?: string;
  type: "Income" | "Expense";
  amount: number;
  date?: string;
  category?: string;
  isFixed?: boolean;
  planId?: string | number;
  onPress?: () => void;
  onDelete?: () => void;
  multiplier?: number;
  /** Hide per-row amount when section header already shows day total. */
  showAmount?: boolean;
}

export const CashflowRow: React.FC<CashflowRowProps> = ({
  title,
  subtitle,
  leadingIcon,
  type,
  amount,
  category,
  isFixed,
  onPress,
  onDelete,
  multiplier,
  showAmount = true,
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
      <View style={styles.leftBlock}>
        {leadingIcon ? (
          <View style={styles.leadingIconWrap}>
            <BaseIcon
              name={leadingIcon}
              size={18}
              color={colors.primaryLight}
            />
          </View>
        ) : null}

        <View style={styles.leftCol}>
          <MText variant="bodyStrong" color="textPrimary" numberOfLines={1}>
            {title}
          </MText>

          <View style={styles.metaRow}>
            {statusIconName && (
              <BaseIcon
                name={statusIconName}
                size={13}
                color={statusIconColor}
                style={{ marginRight: 4 }}
              />
            )}

            {subtitle ? (
              <MText variant="caption" color="textMuted" numberOfLines={1}>
                {subtitle}
              </MText>
            ) : null}

            {!subtitle && category ? (
              <MText variant="caption" color="textMuted" numberOfLines={1}>
                {category}
              </MText>
            ) : null}
          </View>
        </View>
      </View>

      {/* RIGHT */}
      {showAmount || onDelete ? (
        <View style={styles.rightCol}>
          {showAmount ? (
            <View style={styles.amountRow}>
              <BaseIcon
                name={arrowIconName}
                color={amountColor}
                style={{ marginRight: 4, marginTop: 1 }}
              />

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
          ) : null}

          {onDelete ? (
            <IconButton
              onPress={onDelete}
              name="trash-outline"
              color={colors.danger}
              style={styles.iconButton}
            />
          ) : null}
        </View>
      ) : null}
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
  leftBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minWidth: 0,
  },
  leadingIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: "rgba(47,111,237,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  leftCol: {
    flex: 1,
    minWidth: 0,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    gap: 6,
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
