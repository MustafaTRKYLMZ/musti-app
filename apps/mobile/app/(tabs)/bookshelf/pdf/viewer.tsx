import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MText, spacing } from "@budget/ui-native";
import dayjs from "dayjs";

import { PdfReader } from "@/components/ui/pdf/PdfReader";
import { useBooksStore } from "@/store/bookshelf/useBooksStore";
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

  const today = dayjs().format("YYYY-MM-DD");

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [initialPage, setInitialPage] = useState(1);
  const [sectionsOpen, setSectionsOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);

  const pdfRef = useRef<PdfRef | null>(null);

  const progressMap = useBooksStore((s) => s.items);
  const setProgress = useBooksStore((s) => s.setProgress);
  const currentProgress = uri ? progressMap[uri] : undefined;

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

    const last =
      currentProgress?.lastPage && currentProgress.lastPage > 0
        ? currentProgress.lastPage
        : 1;

    setInitialPage(last);
    setCurrentPage(last);
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

    setProgress({
      uri,
      name,
      lastPage: currentProgress?.lastPage ?? 1,
      totalPages: pages,
    });

    if (jumpPage && !appliedJumpOnceRef.current) {
      appliedJumpOnceRef.current = true;
      const safe = Math.max(1, Math.min(pages, jumpPage));
      setTimeout(() => {
        pdfRef.current?.setPage(safe);
      }, 0);
    }
  };

  const handlePageChanged = (page: number, total: number) => {
    setCurrentPage(page);
    setTotalPages(total);
  };

  const handleClose = () => {
    setProgress({
      uri,
      name,
      lastPage: currentPage ?? 1,
      totalPages: totalPages ?? currentProgress?.totalPages ?? undefined,
    });

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

  return (
    <>
      <PdfReader
        isFullscreen={isFullscreen}
        name={name}
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
        readingContext={{ mode: "normal", date: today, bookUri: uri }}
      />

      <BookSectionsSidebar
        visible={sectionsOpen}
        onClose={() => setSectionsOpen(false)}
        bookUri={uri}
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
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
});
