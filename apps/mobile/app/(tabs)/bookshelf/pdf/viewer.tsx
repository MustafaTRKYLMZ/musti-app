import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MText, spacing } from "@budget/ui-native";
import dayjs from "dayjs";

import { PdfReader } from "@/components/ui/pdf/PdfReader";
import { useBooksStore } from "@/store/bookshelf/useBooksStore";
import { useReadingStatsStore } from "@/store/bookshelf/useReadingStatsStore";
import { BookSectionsSidebar } from "@/components/Books/BookSectionsSidebar";
import { PdfRef } from "react-native-pdf";

export default function PdfViewerScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    uri?: string;
    name?: string;
    openSections?: string;
    jumpPage?: string;
    returnTo?: string;
    returnBookUri?: string;
  }>();
  const returnTo = params.returnTo as string | undefined;
  const returnBookUri = params.returnBookUri
    ? decodeURIComponent(params.returnBookUri)
    : undefined;

  const uri = params.uri ? decodeURIComponent(params.uri) : undefined;
  const name = params.name ? decodeURIComponent(params.name) : "PDF";

  const shouldOpenSections = params.openSections === "1";
  const jumpPageParam = params.jumpPage ? Number(params.jumpPage) : null;
  const jumpPage = Number.isFinite(jumpPageParam as number)
    ? (jumpPageParam as number)
    : null;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [initialPage, setInitialPage] = useState(1);
  const [sectionsOpen, setSectionsOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);

  const pdfRef = useRef<PdfRef | null>(null);

  const progressMap = useBooksStore((s) => s.items);
  const setProgress = useBooksStore((s) => s.setProgress);
  const currentProgress = uri ? progressMap[uri] : undefined;

  const addPages = useReadingStatsStore((s) => s.addPages);
  const today = dayjs().format("YYYY-MM-DD");

  const [sessionStartPage, setSessionStartPage] = useState<number | null>(null);
  const [maxPageVisited, setMaxPageVisited] = useState<number | null>(null);
  const [sessionLastPage, setSessionLastPage] = useState<number | null>(null);
  const [sessionTotalPages, setSessionTotalPages] = useState<number | null>(
    currentProgress?.totalPages ?? null
  );
  const openedSectionsOnceRef = useRef(false);
  const appliedJumpOnceRef = useRef(false);

  useEffect(() => {
    if (!shouldOpenSections) return;
    if (openedSectionsOnceRef.current) return;
    openedSectionsOnceRef.current = true;
    setSectionsOpen(true);
  }, [shouldOpenSections]);

  useEffect(() => {
    if (!uri) return;

    if (currentProgress?.lastPage && currentProgress.lastPage > 0) {
      setInitialPage(currentProgress.lastPage);
      setSessionStartPage(currentProgress.lastPage);
      setSessionLastPage(currentProgress.lastPage);
      setMaxPageVisited(currentProgress.lastPage);
    } else {
      setInitialPage(1);
      setSessionStartPage(1);
      setSessionLastPage(1);
      setMaxPageVisited(1);
    }
  }, [uri, currentProgress]);

  if (!uri) {
    return (
      <View style={styles.container}>
        <MText variant="body" color="textPrimary">
          Invalid PDF path
        </MText>
      </View>
    );
  }

  const source = { uri, cache: true };

  const handleLoadComplete = (pages: number) => {
    setTotalPages(pages);
    setSessionTotalPages(pages);
    setProgress({
      uri,
      name,
      lastPage: currentProgress?.lastPage ?? 1,
      totalPages: pages,
    });

    // ✅ apply jumpPage once after load
    if (jumpPage && !appliedJumpOnceRef.current) {
      appliedJumpOnceRef.current = true;
      const safe = Math.max(1, Math.min(pages, jumpPage));
      // next tick (ref hazır olsun)
      setTimeout(() => {
        pdfRef.current?.setPage(safe);
      }, 0);
    }
  };

  const handlePageChanged = (page: number, total: number) => {
    setCurrentPage(page);
    setSessionTotalPages(total);
    setSessionLastPage(page);
    setMaxPageVisited((prev) => {
      if (prev == null) return page;
      return Math.max(prev, page);
    });
  };

  const handleClose = () => {
    if (!uri) {
      router.replace("/(tabs)/bookshelf");
      return;
    }

    const start = sessionStartPage ?? 1;
    const end =
      maxPageVisited ?? sessionLastPage ?? sessionStartPage ?? initialPage ?? 1;

    const pagesDelta = Math.max(0, end - start);

    setProgress({
      uri,
      name,
      lastPage: sessionLastPage ?? 1,
      totalPages: sessionTotalPages ?? currentProgress?.totalPages ?? undefined,
    });

    if (pagesDelta > 0) {
      addPages({
        bookUri: uri,
        date: today,
        pages: pagesDelta,
      });
    }
    if (returnTo === "createTarget") {
      router.replace({
        pathname: "/(tabs)/bookshelf",
        params: {
          openCreateTarget: "1",
          targetBookUri: returnBookUri ? encodeURIComponent(returnBookUri) : "",
        },
      });
      return;
    }

    router.replace("/(tabs)/bookshelf");
  };

  const handleOpenSections = () => setSectionsOpen(true);
  const handleCloseSections = () => setSectionsOpen(false);

  const handleJumpToPage = (page: number) => {
    if (!pdfRef.current) return;
    if (page <= 0) return;
    pdfRef.current.setPage(page);
  };

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
        pdfRef={pdfRef}
        onPressMenu={handleOpenSections}
        currentPage={currentPage}
        totalPages={totalPages ?? undefined}
      />

      <BookSectionsSidebar
        visible={sectionsOpen}
        onClose={handleCloseSections}
        bookUri={uri}
        onJumpToPage={handleJumpToPage}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
});
