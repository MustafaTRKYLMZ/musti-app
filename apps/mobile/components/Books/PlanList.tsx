import React, { FC, useEffect, useMemo } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import dayjs from "dayjs";
import { bookshelfTheme, MText, radii, spacing } from "@musti/ui-native";
import { ShelfHeader } from "./ShelfHeader";
import { PlanCard, PlanInfo } from "@/components/Books/PlanCard";
import { useReadingEventsStore } from "@/store/bookshelf/useReadingEventsStore";
import { useBooksStore } from "@/store/bookshelf/useBooksStore";
import type { ReadingEvent } from "@musti/core";

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

  // ✅ new: open edit modal
  openEditPlan: (planId: string) => void;
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
      typeof e.durationMs === "number" && Number.isFinite(e.durationMs)
        ? Math.max(0, e.durationMs)
        : 0;

    totalMs += ms;
  }

  return Math.round(totalMs / 60000);
};

// ✅ today plan-mode içinde: bu planın kitapları arasından en son okunan bookUri
const getCurrentBookUriForPlanToday = (args: {
  events: ReadingEvent[];
  today: string;
  bookUris: string[];
}) => {
  const { events, today, bookUris } = args;
  if (!events?.length) return undefined;
  if (!bookUris?.length) return undefined;

  const set = new Set(bookUris.filter(Boolean));

  let bestUri: string | undefined = undefined;
  let bestAt = -1;

  for (const e of events) {
    if (!e) continue;
    if (e.date !== today) continue;
    if (e.mode !== "plan") continue;
    if (!set.has(e.bookUri)) continue;

    const at = typeof e.at === "number" && Number.isFinite(e.at) ? e.at : 0;

    if (at >= bestAt) {
      bestAt = at;
      bestUri = e.bookUri;
    }
  }

  return bestUri;
};

export const PlanList: FC<PlanListProps> = ({
  setPlanModalVisible,
  plans,
  suppressNextPlanOpenRef,
  openPlanDirect,
  handleDeletePlan,
  openEditPlan,
}) => {
  const events = useReadingEventsStore((s) => s.events);

  // ✅ books store’dan uri->name map
  const booksAny = useBooksStore(
    (s: any) => s.books ?? s.items ?? s.library ?? s.byUri ?? []
  );

  const bookNameByUri = useMemo(() => {
    const map = new Map<string, string>();

    if (Array.isArray(booksAny)) {
      for (const b of booksAny) {
        const uri = b?.uri ?? b?.bookUri ?? b?.fileUri;
        const name = b?.name ?? b?.title ?? b?.bookName;
        if (
          typeof uri === "string" &&
          uri &&
          typeof name === "string" &&
          name
        ) {
          map.set(uri, name);
        }
      }
      return map;
    }

    if (booksAny && typeof booksAny === "object") {
      for (const [uri, b] of Object.entries<any>(booksAny)) {
        const name = b?.name ?? b?.title ?? b?.bookName;
        if (
          typeof uri === "string" &&
          uri &&
          typeof name === "string" &&
          name
        ) {
          map.set(uri, name);
        }
      }
      return map;
    }

    return map;
  }, [booksAny]);

  const resolveBookName = (uri: string) => bookNameByUri.get(uri) ?? undefined;

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

              // ✅ real active book for this plan (today, plan mode)
              const currentBookUri = getCurrentBookUriForPlanToday({
                events: events ?? [],
                today,
                bookUris,
              });
              const currentBookName = currentBookUri
                ? resolveBookName(currentBookUri)
                : undefined;

              const currentPlanInfo: PlanInfo = {
                name: item.name,
                totalCompleted: done,
                totalPagesInPlan: totalTarget,
                isCompleted: totalTarget > 0 && done >= totalTarget,
                todayMinutes,
                currentBookUri,
                currentBookName,
              };

              // ✅ items with names for per-dot display
              const itemsWithNames = item.items.map((it) => ({
                ...it,
                bookName: resolveBookName(it.bookUri),
              }));

              return (
                <View style={styles.cardItem}>
                  <PlanCard
                    planId={item.id}
                    planItems={itemsWithNames}
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
                      openEditPlan(item.id);
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
