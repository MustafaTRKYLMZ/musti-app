import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useTranslation, type ReceiptScanType } from "@musti/core";
import { MText, colors, spacing, radii } from "@musti/ui-native";

type Props = {
  onSelect: (type: ReceiptScanType) => void;
};

const OPTIONS: Array<{
  type: ReceiptScanType;
  icon: string;
  labelKey: string;
  hintKey: string;
}> = [
  {
    type: "market",
    icon: "🛒",
    labelKey: "receipt.type.market",
    hintKey: "receipt.type.marketHint",
  },
  {
    type: "fuel",
    icon: "⛽",
    labelKey: "receipt.type.fuel",
    hintKey: "receipt.type.fuelHint",
  },
  {
    type: "restaurant",
    icon: "🍽",
    labelKey: "receipt.type.restaurant",
    hintKey: "receipt.type.restaurantHint",
  },
];

export function ReceiptTypeSelector({ onSelect }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <MText variant="bodyStrong" style={styles.title}>
        {t("receipt.type.title")}
      </MText>
      <MText variant="caption" color="textSecondary" style={styles.subtitle}>
        {t("receipt.type.subtitle")}
      </MText>

      <View style={styles.options}>
        {OPTIONS.map((option) => (
          <Pressable
            key={option.type}
            style={styles.option}
            onPress={() => onSelect(option.type)}
            accessibilityRole="button"
          >
            <MText variant="title" style={styles.icon}>
              {option.icon}
            </MText>
            <MText variant="bodyStrong">{t(option.labelKey)}</MText>
            <MText variant="caption" color="textSecondary" style={styles.optionHint}>
              {t(option.hintKey)}
            </MText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 360,
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
  },
  options: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  option: {
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    gap: spacing.xs,
  },
  icon: {
    fontSize: 28,
  },
  optionHint: {
    marginTop: spacing.xs,
  },
});
