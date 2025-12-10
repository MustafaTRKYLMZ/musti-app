import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MText, colors, spacing, radii, iconSizes } from "@budget/ui-native";
import { Ionicons } from "@expo/vector-icons";

import { PdfReader } from "@/components/ui/pdf/PdfReader";
import { useReadingPlanStore } from "@/store/useReadingPlanStore";

export default function PlanViewerScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    uri?: string;
    name?: string;
  }>();

  const uri = params.uri as string | undefined;
  const name = (params.name as string) || "PDF";

  const activePlan = useReadingPlanStore((s) => s.activePlan);
  const addPagesFromSession = useReadingPlanStore((s) => s.addPagesFromSession);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [initialPage, setInitialPage] = useState(1);

  // Session-local state
  const [sessionStartPage, setSessionStartPage] = useState<number | null>(null);
  const [sessionLastPage, setSessionLastPage] = useState<number | null>(null);
  const [maxPageVisited, setMaxPageVisited] = useState<number | null>(null);
  const [sessionTotalPages, setSessionTotalPages] = useState<number | null>(
    null
  );

  // Plan config / meta
  const [initialPagesReadToday, setInitialPagesReadToday] = useState(0);
  const [targetForToday, setTargetForToday] = useState(0);
  const [todayPagesForThisBook, setTodayPagesForThisBook] = useState(0);
  const [hasReachedTarget, setHasReachedTarget] = useState(false);

  useEffect(() => {
    if (!uri || !activePlan) return;

    const items = activePlan.items;
    const itemIndex = items.findIndex((it) => it.bookUri === uri);
    if (itemIndex === -1) return;

    const item = items[itemIndex];
    const pb = activePlan.perBook[uri];

    const startPage = pb?.currentPageInBook ?? 1;
    const alreadyReadToday = pb?.pagesReadToday ?? 0;
    const target = item.pagesPerDay;

    setInitialPage(startPage);
    setSessionStartPage(startPage);
    setSessionLastPage(startPage);
    setMaxPageVisited(startPage);

    setInitialPagesReadToday(alreadyReadToday);
    setTargetForToday(target);
    setTodayPagesForThisBook(alreadyReadToday);
    setHasReachedTarget(alreadyReadToday >= target && target > 0);
  }, [uri, activePlan]);

  if (!uri) {
    return (
      <View style={styles.container}>
        <MText variant="body" color="textPrimary">
          Invalid PDF path
        </MText>
      </View>
    );
  }

  if (!activePlan || !activePlan.perBook[uri]) {
    return (
      <View style={styles.container}>
        <MText variant="body" color="textPrimary">
          This book is not in the current plan.
        </MText>
      </View>
    );
  }

  const items = activePlan.items;
  const currentItemIndex = items.findIndex((it) => it.bookUri === uri);

  const source = { uri, cache: true };

  const handleLoadComplete = (pages: number) => {
    console.log("[PLAN VIEW] PDF loaded, total pages:", pages);
    setSessionTotalPages(pages);
    // Plan viewer: we do NOT touch the global book progress here.
  };

  const handlePageChanged = (page: number, total: number) => {
    console.log(`[PLAN VIEW] Page changed: ${page} / ${total}`);
    setSessionTotalPages(total);
    setSessionLastPage(page);

    setMaxPageVisited((prev) => {
      if (prev == null) return page;
      return Math.max(prev, page);
    });

    // Target check (local only)
    const start = sessionStartPage ?? page;
    const maxVisited = Math.max(page, maxPageVisited ?? page);
    const pagesInThisSession = Math.max(0, maxVisited - start);

    const totalTodayForThisBook = initialPagesReadToday + pagesInThisSession;
    setTodayPagesForThisBook(totalTodayForThisBook);

    if (!hasReachedTarget && targetForToday > 0) {
      if (totalTodayForThisBook >= targetForToday) {
        setHasReachedTarget(true);
      }
    }
  };

  const flushToPlan = (bookUri: string) => {
    const start = sessionStartPage ?? 1;
    const maxVisited = maxPageVisited ?? sessionLastPage ?? start;
    const pagesDelta = Math.max(0, maxVisited - start);

    if (pagesDelta > 0) {
      console.log("[PLAN VIEW] flushToPlan", {
        bookUri,
        pagesDelta,
        totalPages: sessionTotalPages,
      });

      addPagesFromSession({
        bookUri,
        pages: pagesDelta,
        // Used on the plan side to know if we've reached the end of the book
        bookTotalPages: sessionTotalPages ?? undefined,
      });
    }
  };

  const goToNextBookInPlan = () => {
    if (!activePlan || currentItemIndex === -1) return;

    // First, flush current session progress for this book into the plan
    flushToPlan(uri);

    // Find the next book whose daily target is not yet completed
    const totalItems = items.length;
    let idx = (currentItemIndex + 1) % totalItems;
    let looped = false;
    let nextItem: (typeof items)[number] | null = null;

    while (true) {
      const candidate = items[idx];
      const pb = activePlan.perBook[candidate.bookUri];
      const alreadyRead = pb?.pagesReadToday ?? 0;

      if (alreadyRead < candidate.pagesPerDay) {
        nextItem = candidate;
        break;
      }

      idx = (idx + 1) % totalItems;
      if (idx === currentItemIndex) {
        // We have looped through all items and found none with remaining target
        looped = true;
        break;
      }
    }

    if (!nextItem || looped) {
      // Today's plan is fully completed
      router.back();
      return;
    }

    // Open a new plan viewer for the next book
    router.replace({
      pathname: "/plan/plan-viewer",
      params: {
        uri: nextItem.bookUri,
        name: nextItem.bookName,
      },
    });
  };

  const handleClose = () => {
    // Session ended for this book -> flush and go back
    flushToPlan(uri);
    router.back();
  };

  const clampedToday =
    targetForToday > 0
      ? Math.min(todayPagesForThisBook, targetForToday)
      : todayPagesForThisBook;

  return (
    <>
      <PdfReader
        isFullscreen={isFullscreen}
        name={name}
        setIsFullscreen={setIsFullscreen}
        handleClose={handleClose}
        source={source}
        initialPage={initialPage}
        handleLoadComplete={handleLoadComplete}
        handlePageChanged={handlePageChanged}
      />

      {/* Strong banner when the daily target is completed */}
      {hasReachedTarget && (
        <View style={styles.bannerWrapper} pointerEvents="box-none">
          <View style={styles.banner}>
            <Ionicons
              name="checkmark-circle"
              size={iconSizes.lg}
              color={colors.success}
            />
            <View style={styles.bannerText}>
              <MText variant="body" color="textPrimary" numberOfLines={1}>
                Today's target is done 🎉
              </MText>
              {targetForToday > 0 && (
                <MText variant="body" color="textSecondary" numberOfLines={1}>
                  {name}: {clampedToday} / {targetForToday} pages
                </MText>
              )}
            </View>

            <TouchableOpacity
              onPress={goToNextBookInPlan}
              style={styles.bannerButton}
            >
              <MText variant="body" color="textInverse">
                Next book
              </MText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  bannerWrapper: {
    position: "absolute",
    bottom: spacing.lg,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  banner: {
    maxWidth: "94%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.success,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 6,
  },
  bannerText: {
    flex: 1,
  },
  bannerButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
  },
});
