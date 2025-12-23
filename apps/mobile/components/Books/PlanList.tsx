import React, { FC, useEffect, useMemo } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import { bookshelfTheme, MText, radii, spacing } from "@budget/ui-native";
import { ShelfHeader } from "../ShelfHeader";
import { PlanCard, PlanInfo } from "@/components/Books/PlanCard";
import { useReadingEventsStore } from "@/store/bookshelf/useReadingEventsStore";
import type { ReadingEvent } from "@budget/core";

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

const sumTodayMinutesForPlan = (args: {
  events: ReadingEvent[];
  today: string;
  bookUris: string[];
}) => {
  const { events, today, bookUris } = args;
  if (!events?.length) return 0;
  if (!bookUris?.length) return 0;

  const set = new Set(bookUris.filter(Boolean));
  let totalMs = 0;

  for (const e of events) {
    if (!e) continue;
    if (e.date !== today) continue;
    if (e.mode !== "plan") continue;
    if (!set.has(e.bookUri)) continue;

    const ms =
      typeof (e as any).durationMs === "number" &&
      Number.isFinite((e as any).durationMs)
        ? Math.max(0, (e as any).durationMs)
        : 0;

    totalMs += ms;
  }

  // 0 yazmasın diye istersen Math.ceil kullanabilirsin:
  // return Math.ceil(totalMs / 60000);
  return Math.round(totalMs / 60000);
};

export const PlanList: FC<PlanListProps> = ({
  setPlanModalVisible,
  plans,
  suppressNextPlanOpenRef,
  openPlanDirect,
  handleDeletePlan,
}) => {
  const router = useRouter();

  const events = useReadingEventsStore((s) => s.events);

  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);

  useEffect(() => {
    suppressNextPlanOpenRef.current = false;
  }, [suppressNextPlanOpenRef]);

  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      const aTotal = a.items.reduce((s, it) => s + (it.pagesPerDay || 0), 0);
      const bTotal = b.items.reduce((s, it) => s + (it.pagesPerDay || 0), 0);

      const aDone = (a.totalReadToday ?? 0) >= aTotal && aTotal > 0;
      const bDone = (b.totalReadToday ?? 0) >= bTotal && bTotal > 0;

      if (aDone !== bDone) return aDone ? 1 : -1;

      return 0;
    });
  }, [plans]);

  return (
    <View style={styles.shelfSection}>
      <ShelfHeader title="Plans" handleOpen={() => setPlanModalVisible(true)} />
      <View style={styles.shelfInner}>
        <View style={styles.shelfRail} />

        {sortedPlans.length === 0 ? (
          <View style={styles.emptyPlanShelf}>
            <MText variant="body" color="textSecondary">
              No plans yet. Create one to track your reading.
            </MText>
          </View>
        ) : (
          <FlatList
            data={sortedPlans}
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
              const bookUris = item.items.map((x) => x.bookUri).filter(Boolean);

              const todayMinutes = sumTodayMinutesForPlan({
                events: events ?? [],
                today,
                bookUris,
              });

              const currentPlanInfo: PlanInfo = {
                name: item.name,
                totalCompleted: done,
                totalPagesInPlan: totalTarget,
                isCompleted: totalTarget > 0 && done >= totalTarget,
                todayMinutes,
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
