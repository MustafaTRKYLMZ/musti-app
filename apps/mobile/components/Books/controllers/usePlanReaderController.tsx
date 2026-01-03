import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import dayjs from "dayjs";
import type { PdfRef } from "react-native-pdf";
import { MText, spacing, radii, iconSizes, useTheme } from "@budget/ui-native";

import { useReadingPlanStore } from "@/store/bookshelf/useReadingPlanStore";
import { IconButton, BaseIcon } from "@/components/ui/AppIcon";
import { useReadingGamificationStore } from "@/store/bookshelf/readingGamification/useReadingGamificationStore";
import { useLastGainStore } from "@/hooks/useLastGain";
import { scheduleMotivationNudgeIfNeeded } from "@/utils/motivation";

import type { ReaderShellProps } from "@/components/Books/ReaderShell";
import { usePdfSource } from "./usePdfSource";

export function usePlanReaderController(): ReaderShellProps {
  const router = useRouter();
  const { colors } = useTheme();

  const params = useLocalSearchParams<{
    planId?: string;
    uri?: string;
    name?: string;
  }>();

  const planId = params.planId ? String(params.planId) : undefined;
  const uri = params.uri ? decodeURIComponent(String(params.uri)) : undefined;
  const name = params.name ? decodeURIComponent(String(params.name)) : "PDF";

  const today = dayjs().format("YYYY-MM-DD");

  const plans = useReadingPlanStore((s) => s.plans);
  const addPagesFromSession = useReadingPlanStore((s) => s.addPagesFromSession);

  const plan = useMemo(() => {
    if (!planId) return null;
    return (plans ?? []).find((p) => p.id === planId) ?? null;
  }, [plans, planId]);

  const items = plan?.items ?? [];
  const currentItemIndex = uri
    ? items.findIndex((it) => it.bookUri === uri)
    : -1;

  const pdfRef = useRef<PdfRef | null>(null);

  const [initialPage, setInitialPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);

  const [sessionStartPage, setSessionStartPage] = useState<number | null>(null);
  const [sessionLastPage, setSessionLastPage] = useState<number | null>(null);
  const [maxPageVisited, setMaxPageVisited] = useState<number | null>(null);
  const [sessionTotalPages, setSessionTotalPages] = useState<number | null>(
    null
  );

  const [initialPagesReadToday, setInitialPagesReadToday] = useState(0);
  const [targetForToday, setTargetForToday] = useState(0);
  const [todayPagesForThisBook, setTodayPagesForThisBook] = useState(0);
  const [hasReachedTarget, setHasReachedTarget] = useState(false);

  const bannerAnim = useRef(new Animated.Value(0)).current;
  const reachedOnceRef = useRef(false);

  useEffect(() => {
    reachedOnceRef.current = false;
  }, [uri, planId]);

  useEffect(() => {
    if (!uri || !plan) return;
    if (currentItemIndex === -1) return;

    const item = items[currentItemIndex];
    const pb = plan.perBook?.[uri] ?? {
      bookUri: uri,
      currentPageInBook: 1,
      pagesReadToday: 0,
      bookTotalPages: undefined,
    };

    const startPage = pb.currentPageInBook ?? 1;
    const alreadyReadToday = pb.pagesReadToday ?? 0;
    const target = item.pagesPerDay ?? 0;

    setInitialPage(startPage);
    setSessionStartPage(startPage);
    setSessionLastPage(startPage);
    setMaxPageVisited(startPage);

    setInitialPagesReadToday(alreadyReadToday);
    setTargetForToday(target);
    setTodayPagesForThisBook(alreadyReadToday);
    setHasReachedTarget(alreadyReadToday >= target && target > 0);

    setCurrentPage(startPage);
  }, [uri, plan, currentItemIndex, items]);

  useEffect(() => {
    if (hasReachedTarget) {
      Animated.spring(bannerAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
      }).start();
    } else {
      Animated.timing(bannerAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [hasReachedTarget, bannerAnim]);

  const { guard, source } = usePdfSource({
    uri,
    invalidText: "Invalid PDF path",
    preparingText: "Preparing PDF…",
    failedText: "Failed to load PDF.",
  });

  const onLoadComplete = (pages: number) => {
    setSessionTotalPages(pages);
    setTotalPages(pages);
  };

  const onPageChanged = (page: number, total: number) => {
    setSessionTotalPages(total);
    setSessionLastPage(page);
    setCurrentPage(page);

    // ✅ avoid stale maxPageVisited usage
    const prevMax = maxPageVisited ?? page;
    const nextMax = Math.max(prevMax, page);
    setMaxPageVisited(nextMax);

    const start = sessionStartPage ?? page;
    const pagesInThisSession = Math.max(0, nextMax - start);

    const totalTodayForThisBook = initialPagesReadToday + pagesInThisSession;
    setTodayPagesForThisBook(totalTodayForThisBook);

    if (
      !hasReachedTarget &&
      targetForToday > 0 &&
      totalTodayForThisBook >= targetForToday
    ) {
      setHasReachedTarget(true);

      if (!reachedOnceRef.current) {
        reachedOnceRef.current = true;

        const at = Date.now();
        const bonus = useReadingGamificationStore
          .getState()
          .onPlanCompleted({ at, bookUri: uri! });

        if (bonus > 0) {
          useLastGainStore.getState().emit({
            at,
            xp: bonus,
            pages: 0,
            mode: "plan",
            bookUri: uri!,
            kind: "planComplete",
          });
        }

        void scheduleMotivationNudgeIfNeeded().catch(() => {});
      }
    }
  };

  const flushToPlan = (bookUri: string) => {
    const start = sessionStartPage ?? 1;
    const maxVisited = maxPageVisited ?? sessionLastPage ?? start;
    const pagesDelta = Math.max(0, maxVisited - start);

    if (pagesDelta > 0) {
      addPagesFromSession({
        planId: planId!,
        bookUri,
        pages: pagesDelta,
        bookTotalPages: sessionTotalPages ?? undefined,
      });
    }
  };

  const goToNextBookInPlan = () => {
    if (!plan || !planId || !uri) return;

    flushToPlan(uri);

    const totalItems = items.length;
    let idx = (currentItemIndex + 1) % totalItems;
    let nextItem: (typeof items)[number] | null = null;

    // Look for next book with incomplete pages, starting from next index
    for (let step = 0; step < totalItems; step++) {
      const candidate = items[idx];
      const pb = plan.perBook?.[candidate.bookUri];
      const alreadyRead = pb?.pagesReadToday ?? 0;
      const target = candidate.pagesPerDay ?? 0;

      if (alreadyRead < target) {
        nextItem = candidate;
        break;
      }

      idx = (idx + 1) % totalItems;

      // If we've cycled back to current index, all books are complete
      if (idx === currentItemIndex) break;
    }

    if (!nextItem) {
      router.replace("/(tabs)/bookshelf");
      return;
    }

    router.replace({
      pathname: "/(tabs)/bookshelf/plan/plan-viewer",
      params: {
        planId,
        uri: encodeURIComponent(nextItem.bookUri),
        name: encodeURIComponent(nextItem.bookName),
      },
    });
  };

  const onClose = () => {
    if (uri) flushToPlan(uri);
    void scheduleMotivationNudgeIfNeeded().catch(() => {});
    router.replace("/(tabs)/bookshelf");
  };

  const clampedToday =
    targetForToday > 0
      ? Math.min(todayPagesForThisBook, targetForToday)
      : todayPagesForThisBook;

  const remainingPagesToday =
    targetForToday > 0
      ? Math.max(0, targetForToday - todayPagesForThisBook)
      : null;

  const bannerStyle = {
    transform: [
      {
        translateY: bannerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [40, 0],
        }),
      },
      {
        scale: bannerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1],
        }),
      },
    ],
    opacity: bannerAnim,
    backgroundColor: colors.surface,
    borderColor: colors.success,
  } as const;

  const bannerButtonStyle = { backgroundColor: colors.primary } as const;

  const banner = hasReachedTarget ? (
    <View style={styles.bannerWrapper} pointerEvents="box-none">
      <Animated.View style={[styles.banner, bannerStyle]}>
        <BaseIcon
          family="ion"
          name="checkmark-circle"
          size={iconSizes.lg}
          color={colors.success}
        />
        <View style={styles.bannerText}>
          <MText variant="body" color="textPrimary" numberOfLines={1}>
            {"Today's target is done 🎉"}
          </MText>
          {targetForToday > 0 && (
            <MText variant="body" color="textSecondary" numberOfLines={1}>
              {name}: {clampedToday} / {targetForToday} pages
            </MText>
          )}
        </View>
        <IconButton
          family="ion"
          name="arrow-forward"
          size={22}
          color={colors.textInverse}
          onPress={goToNextBookInPlan}
          style={[styles.bannerButton, bannerButtonStyle]}
          accessibilityLabel="Next book"
        />
      </Animated.View>
    </View>
  ) : null;

  return {
    guard,
    source,
    name,
    initialPage,
    currentPage,
    totalPages: totalPages ?? undefined,
    onLoadComplete,
    onPageChanged,
    onClose,
    readingContext: { mode: "plan", date: today, bookUri: uri },
    timeLeftRemainingPages: remainingPagesToday,
    bookUriForSidebar: uri ?? "",
    initialSectionsOpen: false,
    banner,
    pdfRef,
  };
}

const styles = StyleSheet.create({
  bannerWrapper: {
    position: "absolute",
    bottom: spacing["6xl"] + 16,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  banner: {
    maxWidth: "94%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 6,
  },
  bannerText: { flex: 1 },
  bannerButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.lg,
  },
});
