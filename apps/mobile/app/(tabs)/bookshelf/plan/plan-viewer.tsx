// apps/mobile/.../PlanViewerScreen.tsx
import React, { useEffect, useState } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MText, spacing, radii, iconSizes, useTheme } from "@budget/ui-native";

import { PdfReader } from "@/components/ui/pdf/PdfReader";
import { useReadingPlanStore } from "@/store/useReadingPlanStore";
import { IconButton, BaseIcon } from "@/components/ui/AppIcon";

export default function PlanViewerScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { colors } = theme;

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

  // banner animation
  const bannerAnim = React.useRef(new Animated.Value(0)).current;

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

  if (!uri) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <MText variant="body" color="textPrimary">
          Invalid PDF path
        </MText>
      </View>
    );
  }

  if (!activePlan || !activePlan.perBook[uri]) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
    setSessionTotalPages(pages);
  };

  const handlePageChanged = (page: number, total: number) => {
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
      addPagesFromSession({
        bookUri,
        pages: pagesDelta,
        bookTotalPages: sessionTotalPages ?? undefined,
      });
    }
  };

  const goToNextBookInPlan = () => {
    if (!activePlan || currentItemIndex === -1) return;

    flushToPlan(uri);
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
        looped = true;
        break;
      }
    }

    if (!nextItem || looped) {
      router.replace("/(tabs)/bookshelf");
      return;
    }

    router.replace({
      pathname: "/(tabs)/bookshelf/plan/plan-viewer",
      params: {
        uri: nextItem.bookUri,
        name: nextItem.bookName,
      },
    });
  };

  const handleClose = () => {
    flushToPlan(uri);
    router.replace("/(tabs)/bookshelf");
  };

  const clampedToday =
    targetForToday > 0
      ? Math.min(todayPagesForThisBook, targetForToday)
      : todayPagesForThisBook;

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

  const bannerButtonStyle = {
    backgroundColor: colors.primary,
  } as const;

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
          <Animated.View style={[styles.banner, bannerStyle]}>
            <BaseIcon
              family="ion"
              name="checkmark-circle"
              size={iconSizes.lg}
              color={colors.success}
            />
            <View style={styles.bannerText}>
              <MText variant="body" color="textPrimary" numberOfLines={1}>
                Today&apos;s target is done 🎉
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
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
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
    borderWidth: 1,
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
  },
});
