// apps/mobile/features/books/CurrentPlanCard.tsx
import React, { FC } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { MText, colors, spacing, radii, iconSizes } from "@budget/ui-native";
import { BaseIcon, IconButton } from "@/components/ui/AppIcon";

export type CurrentPlanInfo = {
  name: string;
  isCompleted: boolean;
  totalCompleted: number;
  totalPagesInPlan: number;
  currentBookName?: string;
  currentBookUri?: string;
  remainingInItem?: number;
  suggestedBookName?: string;
};

type CurrentPlanCardProps = {
  currentPlanInfo: CurrentPlanInfo | null;
  onPress: () => void;
  onDeletePlan: () => void;
};

export const CurrentPlanCard: FC<CurrentPlanCardProps> = ({
  currentPlanInfo,
  onPress,
  onDeletePlan,
}) => {
  if (!currentPlanInfo) return null;

  const {
    name,
    isCompleted,
    totalCompleted,
    totalPagesInPlan,
    currentBookName,
    remainingInItem,
    suggestedBookName,
  } = currentPlanInfo;

  const progressText = `${totalCompleted} / ${totalPagesInPlan} pages`;

  const subtitle = isCompleted
    ? suggestedBookName
      ? `Today's plan is done. To keep reading, continue with "${suggestedBookName}".`
      : "Today's plan is done."
    : currentBookName
    ? `Now: ${currentBookName}${
        typeof remainingInItem === "number"
          ? ` (${remainingInItem} pages left in this step)`
          : ""
      }`
    : "Plan is in progress.";

  return (
    <TouchableOpacity
      style={styles.planSummary}
      activeOpacity={0.85}
      onPress={isCompleted ? undefined : onPress}
    >
      <View style={styles.planSummaryLeft}>
        <BaseIcon
          name={isCompleted ? "checkmark-done-outline" : "time-outline"}
          size={iconSizes.lg}
          color={isCompleted ? colors.success : colors.textPrimary}
        />

        <View style={styles.planSummaryText}>
          <MText variant="body" color="textPrimary" numberOfLines={1}>
            Current plan: {name}
          </MText>

          <MText variant="body" color="textSecondary" numberOfLines={2}>
            {subtitle}
          </MText>
        </View>
      </View>

      <View style={styles.planSummaryRight}>
        <MText variant="body" color="textSecondary">
          {progressText}
        </MText>

        <IconButton
          name="trash-outline"
          size={iconSizes.md}
          color={colors.danger}
          onPress={onDeletePlan}
          style={styles.planDeleteButton}
          hitSlop={8}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  planSummary: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  planSummaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
  },
  planSummaryText: {
    flex: 1,
  },
  planSummaryRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  planDeleteButton: {
    padding: spacing.xs,
  },
});
