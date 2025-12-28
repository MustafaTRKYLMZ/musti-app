import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { MText, spacing, useTheme } from "@budget/ui-native";
import type { PdfRef } from "react-native-pdf";
import type { ReadingMode } from "@budget/core";

import { PdfReader } from "@/components/Books/PdfReader";
import { BookSectionsSidebar } from "@/components/Books/BookSectionsSidebar";

export type ReaderGuard = { kind: "ok" } | { kind: "message"; text: string };

export type ReadingContext = {
  mode: ReadingMode;
  date: string;
  bookUri?: string;
  targetId?: string;
  sectionId?: string;
  sectionTitle?: string;
};

export type ReaderShellProps = {
  // Guard / early UI
  guard: ReaderGuard;

  // Source + header
  source: { uri: string; cache?: boolean };
  name: string;

  // Core paging
  initialPage: number;
  currentPage: number;
  totalPages?: number;

  // Callbacks
  onLoadComplete: (pages: number) => void;
  onPageChanged: (page: number, total: number) => void;
  onClose: () => void;

  // Context / extras (pass-through to PdfReader)
  readingContext: ReadingContext;
  timeLeftRemainingPages?: number | null;

  // Sidebar
  bookUriForSidebar: string;
  initialSectionsOpen?: boolean;

  // Optional overlay banner (plan gibi)
  banner?: React.ReactNode;

  // Allow controller to own pdfRef (jumpPage gibi durumlar için)
  pdfRef: React.RefObject<PdfRef | null>;
};

export const ReaderShell = ({
  guard,
  source,
  name,
  initialPage,
  currentPage,
  totalPages,
  onLoadComplete,
  onPageChanged,
  onClose,
  readingContext,
  timeLeftRemainingPages,
  bookUriForSidebar,
  initialSectionsOpen,
  banner,
  pdfRef,
}: ReaderShellProps) => {
  const { colors } = useTheme();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);

  useEffect(() => {
    if (initialSectionsOpen) setSectionsOpen(true);
  }, [initialSectionsOpen]);

  if (guard.kind === "message") {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <MText variant="body" color="textPrimary">
          {guard.text}
        </MText>
      </View>
    );
  }

  return (
    <>
      <PdfReader
        isFullscreen={isFullscreen}
        name={name}
        setIsFullscreen={setIsFullscreen}
        handleClose={onClose}
        source={source}
        initialPage={initialPage}
        handleLoadComplete={onLoadComplete}
        handlePageChanged={onPageChanged}
        pdfRef={pdfRef}
        onPressMenu={() => setSectionsOpen(true)}
        currentPage={currentPage}
        totalPages={totalPages}
        readingContext={readingContext}
        timeLeftRemainingPages={timeLeftRemainingPages ?? undefined}
      />

      <BookSectionsSidebar
        visible={sectionsOpen}
        onClose={() => setSectionsOpen(false)}
        bookUri={bookUriForSidebar}
        onJumpToPage={(page) => {
          if (!pdfRef.current) return;
          if (page <= 0) return;
          pdfRef.current.setPage(page);
        }}
      />

      {banner}
    </>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
});
