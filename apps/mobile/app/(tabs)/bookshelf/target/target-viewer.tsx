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

export default function TargetViewerScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const params = useLocalSearchParams<{
    targetId?: string;
    uri?: string;
    name?: string;
  }>();

  const targetId = params.targetId ? String(params.targetId) : undefined;
  const uri = params.uri ? decodeURIComponent(String(params.uri)) : undefined;
  const name = params.name ? decodeURIComponent(String(params.name)) : "PDF";

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
  const effectiveName = name ?? activeItem?.bookName ?? "PDF";

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);

  const pdfRef = useRef<PdfRef | null>(null);

  const [initialPage, setInitialPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);

  // ✅ guard: only complete once per active item
  const doneOnceRef = useRef(false);

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

  if (!activeItem || !bookUri) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <MText>No active item.</MText>
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

      // mark done
      void markItemDone(targetId, activeItem.id).catch(() => {});

      // ✅ XP bonus + one-shot toast event
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
      }

      void scheduleMotivationNudgeIfNeeded().catch(() => {});
    }
  };

  const handleClose = () => {
    void scheduleMotivationNudgeIfNeeded().catch(() => {});
    router.replace("/(tabs)/bookshelf");
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
