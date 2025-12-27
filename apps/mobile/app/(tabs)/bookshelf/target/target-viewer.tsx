import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import dayjs from "dayjs";
import { PdfRef } from "react-native-pdf";
import { MText, spacing, useTheme } from "@budget/ui-native";

import { PdfReader } from "@/components/Books/PdfReader";
import { BookSectionsSidebar } from "@/components/Books/BookSectionsSidebar";
import { useReadingTargetsStore } from "@/store/bookshelf/useReadingTargetsStore";
import { scheduleMotivationNudgeIfNeeded } from "@/utils/motivation";

import { useReadingGamificationStore } from "@/store/bookshelf/readingGamification/useReadingGamificationStore";
import { useLastGainStore } from "@/hooks/useLastGain";
import { useToast } from "@/components/ui/ToastProvider";

export default function TargetViewerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showToast } = useToast();

  const params = useLocalSearchParams<{
    targetId?: string;
    uri?: string;
    name?: string;
  }>();

  const targetId = params.targetId ? String(params.targetId) : undefined;
  const uri = params.uri ? decodeURIComponent(String(params.uri)) : undefined;

  const routeName = params.name
    ? decodeURIComponent(String(params.name))
    : undefined;

  const today = dayjs().format("YYYY-MM-DD");

  const hydrated = useReadingTargetsStore((s) => s.hydrated);
  const hydrateTargets = useReadingTargetsStore((s) => s.hydrate);
  const targets = useReadingTargetsStore((s) => s.targets);
  const setItemCursor = useReadingTargetsStore((s) => s.setItemCursor);
  const markItemDone = useReadingTargetsStore((s) => s.markItemDone);

  useEffect(() => {
    if (!hydrated) hydrateTargets();
  }, [hydrated, hydrateTargets]);

  const target = useMemo(() => {
    if (!targetId) return null;
    return (targets ?? []).find((t) => t.id === targetId) ?? null;
  }, [targets, targetId]);

  const activeItem = useMemo(() => {
    const items = target?.items ?? [];
    return items.find((it) => it.status === "active") ?? null;
  }, [target]);

  const bookUri = uri ?? activeItem?.bookUri ?? null;

  // ✅ FIX: fallback to activeItem.bookName when route name is missing
  const effectiveName =
    routeName ??
    (activeItem?.bookName ? String(activeItem.bookName) : undefined) ??
    "PDF";

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);

  const pdfRef = useRef<PdfRef | null>(null);

  const [initialPage, setInitialPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);

  const doneOnceRef = useRef(false);

  // ✅ NEW: local "closing" flag to avoid showing "No active item"
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    void scheduleMotivationNudgeIfNeeded().catch((error) => {
      console.error("Failed to schedule motivation nudge on target close:", error);
    });
    router.replace("/(tabs)/bookshelf");
  };

  // ✅ NEW: if store updates remove activeItem after completion, auto-close
  useEffect(() => {
    if (!hydrated) return;
    if (!target) return;
    if (!targetId) return;
    if (isClosing) return;

    const items = target.items ?? [];
    const hasActive = items.some((it) => it.status === "active");
    const allDone =
      items.length > 0 && items.every((it) => it.status === "done");

    if (!hasActive && allDone) {
      setIsClosing(true);
      handleClose();
    }
  }, [hydrated, target, targetId, isClosing]);

  useEffect(() => {
    doneOnceRef.current = false;

    const start = Math.max(
      1,
      Number(activeItem?.cursorPage ?? activeItem?.jumpPage ?? 1)
    );
    setInitialPage(start);
    setCurrentPage(start);
  }, [activeItem?.id]);

  if (!targetId) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <MText>Invalid targetId</MText>
      </View>
    );
  }

  if (!hydrated) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <MText>Loading…</MText>
      </View>
    );
  }

  if (!target) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <MText>Target not found.</MText>
      </View>
    );
  }

  if (isClosing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <MText>Done.</MText>
      </View>
    );
  }

  // NOTE: don't show "No active item" while we are navigating away.
  if (!activeItem || !bookUri) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <MText>Loading…</MText>
      </View>
    );
  }

  const source = { uri: bookUri, cache: true };

  const startPage = Math.max(
    1,
    Number(activeItem.activeFromPage ?? activeItem.startPage ?? 1)
  );
  const endPage = Math.max(startPage, Number(activeItem.endPage ?? startPage));

  const remainingPages =
    typeof currentPage === "number"
      ? Math.max(0, endPage - currentPage)
      : Math.max(0, endPage - (activeItem.cursorPage ?? startPage));

  const handleLoadComplete = (pages: number) => {
    setTotalPages(pages);
  };

  const handlePageChanged = (page: number) => {
    setCurrentPage(page);

    const clamped = Math.max(startPage, Math.min(endPage, page));
    void setItemCursor(targetId, activeItem.id, clamped).catch(() => {});

    if (!doneOnceRef.current && clamped >= endPage) {
      doneOnceRef.current = true;

      // ✅ set closing immediately to prevent "No active item" flash
      setIsClosing(true);

      void markItemDone(targetId, activeItem.id).catch(() => {});

      const at = Date.now();
      const bonus = useReadingGamificationStore
        .getState()
        .onTargetCompleted({ at, bookUri });

      if (bonus > 0) {
        useLastGainStore.getState().emit({
          at,
          xp: bonus,
          pages: 0,
          mode: "target",
          bookUri,
          kind: "targetComplete",
        });

        // ✅ TOAST: completion + earned XP
        showToast({
          title: "Target completed 🎯",
          message: `You earned ${bonus} XP`,
          duration: 3500,
        });
      } else {
        // ✅ TOAST: completion (no XP bonus)
        showToast({
          title: "Target completed 🎯",
          message: "Nice work!",
          duration: 2500,
        });
      }

      void scheduleMotivationNudgeIfNeeded().catch(() => {});

      // ✅ close now
      handleClose();
    }
  };

  return (
    <>
      <PdfReader
        isFullscreen={isFullscreen}
        name={effectiveName}
        setIsFullscreen={setIsFullscreen}
        handleClose={handleClose}
        source={source}
        initialPage={initialPage}
        handleLoadComplete={(n) => handleLoadComplete(n)}
        handlePageChanged={(p) => handlePageChanged(p)}
        pdfRef={pdfRef}
        onPressMenu={() => setSectionsOpen(true)}
        currentPage={currentPage}
        totalPages={totalPages ?? undefined}
        readingContext={{
          mode: "target",
          date: today,
          bookUri: bookUri,
          targetId: targetId,
          sectionId: activeItem.id,
          sectionTitle: activeItem.label ?? activeItem.bookName,
        }}
        timeLeftRemainingPages={remainingPages}
      />

      <BookSectionsSidebar
        visible={sectionsOpen}
        onClose={() => setSectionsOpen(false)}
        bookUri={bookUri}
        onJumpToPage={(page) => {
          if (!pdfRef.current) return;
          if (page <= 0) return;
          pdfRef.current.setPage(page);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
});
