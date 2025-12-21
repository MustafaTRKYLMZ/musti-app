import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MText, spacing, iconSizes, useTheme } from "@budget/ui-native";
import { PdfRef } from "react-native-pdf";
import dayjs from "dayjs";

import { PdfReader } from "@/components/ui/pdf/PdfReader";
import { IconButton } from "@/components/ui/AppIcon";
import { BookSectionsSidebar } from "@/components/Books/BookSectionsSidebar";

import { useReadingTargetsStore } from "@/store/bookshelf/useReadingTargetsStore";
import { pickActiveItem } from "@/utils/pickActiveItem";
import { findItemById } from "@/utils/findItemById";
import { useToast } from "@/components/ui/ToastProvider";

export default function TargetViewerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showToast } = useToast();

  const today = dayjs().format("YYYY-MM-DD");

  const params = useLocalSearchParams<{ targetId?: string }>();
  const targetId = params.targetId ? String(params.targetId) : undefined;

  const hydrate = useReadingTargetsStore((s) => s.hydrate);
  const hydrated = useReadingTargetsStore((s) => s.hydrated);
  const targets = useReadingTargetsStore((s) => s.targets);

  const markItemDone = useReadingTargetsStore((s) => s.markItemDone);
  const setItemCursor = useReadingTargetsStore((s) => (s as any).setItemCursor);

  const target = useMemo(() => {
    if (!targetId) return null;
    return targets.find((t) => t.id === targetId) ?? null;
  }, [targets, targetId]);

  const displayItem = useMemo(() => pickActiveItem(target), [target]);

  const uri = displayItem?.bookUri;
  const name = displayItem?.bookName ?? "PDF";

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const pdfRef = useRef<PdfRef | null>(null);

  const [initialPage, setInitialPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);

  const doneOnceRef = useRef<string | null>(null);
  const lastCompletedItemIdRef = useRef<string | null>(null);

  // hydrate
  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (!displayItem) return;

    const baseline =
      displayItem.cursorPage ??
      displayItem.activeFromPage ??
      displayItem.jumpPage ??
      displayItem.startPage ??
      1;

    const start = Math.max(1, Math.floor(baseline));
    setInitialPage(start);
    setCurrentPage(start);
    setTotalPages(null);

    doneOnceRef.current = null;
  }, [displayItem?.id]);

  useEffect(() => {
    if (!targetId || !target) return;

    const completedId = lastCompletedItemIdRef.current;
    if (!completedId) return;

    if (displayItem?.id === completedId) return;

    const completed = findItemById(target, completedId);

    if (displayItem) {
      const a = completed?.bookName ?? "Item";
      const b = displayItem.bookName ?? "Next item";
      showToast(`${a} completed — continuing with ${b}`, 3000);
      lastCompletedItemIdRef.current = null;
      return;
    }

    showToast("Target completed 🎉", 3000);
    lastCompletedItemIdRef.current = null;

    const tmr = setTimeout(() => router.back(), 900);
    return () => clearTimeout(tmr);
  }, [targetId, target, displayItem, showToast, router]);

  useEffect(() => {
    if (!hydrated) return;
    if (!targetId) return;
    if (!target) return;

    if (!displayItem) {
      showToast("Target completed 🎉", 1200);
      const tmr = setTimeout(() => router.back(), 900);
      return () => clearTimeout(tmr);
    }
  }, [hydrated, targetId, target, displayItem, showToast, router]);

  // Guards
  if (!targetId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <MText variant="body" color="textPrimary">
          Invalid route params (targetId missing)
        </MText>
      </View>
    );
  }

  if (!hydrated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <MText variant="body" color="textPrimary">
          Loading…
        </MText>
      </View>
    );
  }

  if (!target) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <MText variant="body" color="textPrimary">
          Target not found.
        </MText>
        <View style={{ height: spacing.md }} />
        <IconButton
          family="ion"
          name="chevron-back"
          size={iconSizes.lg}
          color={colors.textPrimary}
          onPress={() => router.back()}
        />
      </View>
    );
  }

  if (!displayItem || !uri) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <MText variant="body" color="textPrimary" style={{ opacity: 0.8 }}>
          Finishing…
        </MText>
      </View>
    );
  }

  const source = { uri, cache: true };
  const handleLoadComplete = (pages: number) => setTotalPages(pages);

  const handleClose = () => router.back();

  const handlePageChanged = async (page: number, total: number) => {
    setTotalPages(total);
    setCurrentPage(page);

    try {
      if (typeof setItemCursor === "function") {
        setItemCursor(targetId, displayItem.id, page);
      }
    } catch {
      showToast("Error updating cursor", 3000);
    }

    const end = Math.max(1, Math.floor(displayItem.endPage ?? 1));

    if (page >= end) {
      if (doneOnceRef.current === displayItem.id) return;
      doneOnceRef.current = displayItem.id;

      lastCompletedItemIdRef.current = displayItem.id;
      await markItemDone(targetId, displayItem.id);
    }
  };

  return (
    <>
      <PdfReader
        isFullscreen={isFullscreen}
        name={`${target.title} • ${name}`}
        setIsFullscreen={setIsFullscreen}
        handleClose={handleClose}
        source={source}
        initialPage={initialPage}
        handleLoadComplete={handleLoadComplete as any}
        handlePageChanged={handlePageChanged}
        pdfRef={pdfRef}
        onPressMenu={() => setSectionsOpen(true)}
        currentPage={currentPage}
        totalPages={totalPages ?? undefined}
        readingContext={{
          mode: "target",
          date: today,
          bookUri: uri,
          targetId: target.id,
        }}
      />

      <BookSectionsSidebar
        visible={sectionsOpen}
        onClose={() => setSectionsOpen(false)}
        bookUri={uri}
        onJumpToPage={(p) => {
          if (!pdfRef.current) return;
          if (p <= 0) return;
          pdfRef.current.setPage(p);
        }}
      />
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
});
