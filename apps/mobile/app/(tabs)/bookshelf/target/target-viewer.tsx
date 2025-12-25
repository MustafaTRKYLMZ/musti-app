// apps/mobile/app/(tabs)/bookshelf/target/target-viewer.tsx
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

export default function TargetViewerScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const params = useLocalSearchParams<{
    targetId?: string;
    uri?: string;
    name?: string;
  }>();

  const targetId = params.targetId ? String(params.targetId) : undefined;
  const uriFromRoute = params.uri
    ? decodeURIComponent(String(params.uri))
    : undefined;
  const nameFromRoute = params.name
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

  const bookUri = uriFromRoute ?? activeItem?.bookUri ?? null;
  const effectiveName = nameFromRoute ?? activeItem?.bookName ?? "PDF";

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);

  const pdfRef = useRef<PdfRef | null>(null);

  const [initialPage, setInitialPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);

  // ✅ set initial page when active item changes
  useEffect(() => {
    const start = Math.max(
      1,
      Number(activeItem?.cursorPage ?? activeItem?.jumpPage ?? 1)
    );
    setInitialPage(start);
    setCurrentPage(start);
  }, [activeItem?.id]);

  // ✅ schedule only when "book changes" (active item changes), not on every page
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!hydrated) return;
    if (!activeItem?.id) return;

    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    // active item changed (user picked another / auto-next after done)
    scheduleMotivationNudgeIfNeeded().catch(() => {});
  }, [hydrated, activeItem?.id]);

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

  // ✅ PdfReader expects (page, numberOfPages)
  const handlePageChanged = (page: number, _numberOfPages: number) => {
    setCurrentPage(page);

    const clamped = Math.max(startPage, Math.min(endPage, page));
    void setItemCursor(targetId, activeItem.id, clamped).catch(() => {});

    // ✅ DONE only triggers here; no schedule on page flip unless done
    if (clamped >= endPage) {
      void markItemDone(targetId, activeItem.id)
        .then(() => scheduleMotivationNudgeIfNeeded().catch(() => {}))
        .catch(() => {});
    }
  };

  const handleClose = () => {
    // ✅ close -> schedule once
    scheduleMotivationNudgeIfNeeded().catch(() => {});
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
        handleLoadComplete={handleLoadComplete}
        handlePageChanged={handlePageChanged}
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
