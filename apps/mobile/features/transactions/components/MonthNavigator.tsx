import React from "react";
import { View, StyleSheet } from "react-native";
import { MText, colors, spacing, radii, iconSizes } from "@budget/ui-native";
import { IconButton } from "@/components/ui/AppIcon";

interface Props {
  monthName: string;
  year: string;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthNavigator({ monthName, year, onPrev, onNext }: Props) {
  return (
    <View style={styles.monthHeader}>
      <IconButton
        onPress={onPrev}
        style={styles.monthNavIcon}
        hitSlop={12}
        name="chevron-back"
        size={iconSizes.xl}
        color={colors.textSecondary}
      />

      <View style={styles.monthTitleBlock}>
        <MText variant="heading3" color="textPrimary">
          {monthName}
        </MText>
        <MText
          variant="caption"
          color="textSecondary"
          style={styles.yearSpacing}
        >
          {year}
        </MText>
      </View>

      <IconButton
        onPress={onNext}
        style={styles.monthNavIcon}
        hitSlop={12}
        name="chevron-forward"
        size={iconSizes.xl}
        color={colors.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  monthTitleBlock: {
    alignItems: "center",
    justifyContent: "center",
  },
  yearSpacing: {
    marginTop: spacing.xs,
  },
  monthNavIcon: {
    padding: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
});
