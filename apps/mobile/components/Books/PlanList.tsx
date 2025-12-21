import React, { FC, useMemo } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { bookshelfTheme, MText, radii, spacing } from "@budget/ui-native";
import { ShelfHeader } from "../ShelfHeader";
import { PlanCard, PlanInfo } from "@/components/Books/PlanCard";

const { colors } = bookshelfTheme;

type PlanListProps = {
  setPlanModalVisible: (visible: boolean) => void;

  plans: Array<{
    id: string;
    name: string;
    items: Array<{
      bookUri: string;
      pagesPerDay: number;
    }>;
    totalReadToday: number;
  }>;

  suppressNextPlanOpenRef: React.MutableRefObject<boolean>;
  openPlanDirect: (planId: string) => void;
  handleDeletePlan: (planId: string) => void;
};

export const PlanList: FC<PlanListProps> = ({
  setPlanModalVisible,
  plans,
  suppressNextPlanOpenRef,
  openPlanDirect,
  handleDeletePlan,
}) => {
  const router = useRouter();

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  return (
    <View style={styles.shelfSection}>
      <ShelfHeader title="Plans" handleOpen={() => setPlanModalVisible(true)} />
      <View style={styles.shelfInner}>
        <View style={styles.shelfRail} />

        {plans.length === 0 ? (
          <View style={styles.emptyPlanShelf}>
            <MText variant="body" color="textSecondary">
              No plans yet. Create one to track your reading.
            </MText>
          </View>
        ) : (
          <FlatList
            data={plans}
            keyExtractor={(p) => p.id}
            horizontal
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.planListContent}
            renderItem={({ item }) => {
              const totalTarget = item.items.reduce(
                (s, it) => s + (it.pagesPerDay || 0),
                0
              );
              const done = item.totalReadToday || 0;

              const currentPlanInfo: PlanInfo = {
                name: item.name,
                totalCompleted: done,
                totalPagesInPlan: totalTarget,
                isCompleted: totalTarget > 0 && done >= totalTarget,
              };

              return (
                <View style={styles.cardItem}>
                  <PlanCard
                    currentPlanInfo={currentPlanInfo}
                    onPress={() => {
                      if (suppressNextPlanOpenRef.current) return;
                      openPlanDirect(item.id);
                    }}
                    onEditPlan={() => {
                      suppressNextPlanOpenRef.current = true;
                      setTimeout(
                        () => (suppressNextPlanOpenRef.current = false),
                        300
                      );

                      router.push({
                        pathname: "/(tabs)/bookshelf/plan/edit-plan",
                        params: { planId: item.id },
                      });
                    }}
                    onDeletePlan={() => {
                      suppressNextPlanOpenRef.current = true;
                      setTimeout(
                        () => (suppressNextPlanOpenRef.current = false),
                        300
                      );
                      handleDeletePlan(item.id);
                    }}
                    wrapperStyle={{
                      marginHorizontal: 0,
                      marginBottom: 0,
                      marginTop: 0,
                    }}
                  />
                </View>
              );
            }}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shelfSection: { marginBottom: spacing.xl },
  shelfInner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    position: "relative",
  },
  shelfRail: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xs,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.backgroundSecondary,
    opacity: 0.6,
  },
  planListContent: {
    paddingVertical: spacing.sm,
    paddingRight: spacing.lg,
  },

  cardItem: {
    width: 300,
    marginRight: spacing.sm,
  },

  emptyPlanShelf: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
});
