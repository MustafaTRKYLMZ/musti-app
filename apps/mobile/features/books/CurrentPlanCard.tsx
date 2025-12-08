import React, { FC } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { iconSizes, colors, MText, spacing, radii } from "@budget/ui-native";

type CurrentPlanInfo = {
  name: string;
  isCompleted: boolean;
  currentBookName: string;
  remainingInItem: number;
  totalCompleted: number;
  totalPagesInPlan: number;
} | null;

type CurrentPlanCardProps = {
  currentPlanInfo: CurrentPlanInfo;
  onPress: () => void;
  onDeletePlan: () => void;
};

export const CurrentPlanCard: FC<CurrentPlanCardProps> = ({
  currentPlanInfo,
  onPress,
  onDeletePlan,
}) => {
  if (!currentPlanInfo) return null;

  console.log("current Plan info", currentPlanInfo);

  return (
    <TouchableOpacity
      style={styles.planSummary}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.planSummaryLeft}>
        <Ionicons
          name={
            currentPlanInfo.isCompleted
              ? "checkmark-done-outline"
              : "time-outline"
          }
          size={iconSizes.lg}
          color={
            currentPlanInfo.isCompleted ? colors.success : colors.textPrimary
          }
        />
        <View style={styles.planSummaryText}>
          <MText variant="body" color="textPrimary" numberOfLines={1}>
            Current plan: {currentPlanInfo.name}
          </MText>
          <MText variant="body" color="textSecondary" numberOfLines={2}>
            {currentPlanInfo.isCompleted
              ? "Plan completed"
              : `Now: ${currentPlanInfo.currentBookName} (${currentPlanInfo.remainingInItem} pages left in this step)`}
          </MText>
        </View>
      </View>

      <View style={styles.planSummaryRight}>
        <MText variant="body" color="textSecondary">
          {currentPlanInfo.totalCompleted} / {currentPlanInfo.totalPagesInPlan}{" "}
          pages
        </MText>

        <TouchableOpacity
          onPress={onDeletePlan}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.planDeleteButton}
        >
          <Ionicons
            name="trash-outline"
            size={iconSizes.md}
            color={colors.danger}
          />
        </TouchableOpacity>
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
