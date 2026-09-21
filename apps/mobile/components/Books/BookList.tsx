import React, { useMemo } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { useTranslation } from "@musti/core";
import { MText, spacing } from "@musti/ui-native";
import type { LocalPdfFile } from "@/utils/getPdfsDirectory";
import { BookCard } from "./BookCard";
import { PdfCoverPrewarmer } from "@/components/ui/pdf/PdfCoverPrewarmer";
import { SectionAddButton } from "@/components/ui/SectionAddButton";
import { ShelfPlank } from "./ShelfPlank";
import {
  BOOK_TO_SHELF_GAP,
  LAST_READ_TO_BOOKS_GAP,
  SECTION_HEADER_GAP,
  SHELF_ROW_GAP,
} from "./shelfLayout";

type GridBook = LocalPdfFile & { lastOpened: number };

type BookListProps = {
  setModalVisible: (v: boolean) => void;
  gridRows: GridBook[][];
  handleOpenPdf: (item: LocalPdfFile) => void;
  handleDeletePdf: (item: LocalPdfFile) => void;
  onRequestRename?: (file: LocalPdfFile) => void;
  progressMap: Record<string, { lastPage?: number; totalPages?: number }>;
  readingStats?: Record<string, { pagesTotal: number; targetPages: number }>;
};

const COLS = 3;

export const BookList = ({
  setModalVisible,
  gridRows,
  handleOpenPdf,
  handleDeletePdf,
  onRequestRename,
  progressMap,
  readingStats,
}: BookListProps) => {
  const { t } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);
  const { width: screenW } = useWindowDimensions();

  const cellWidth = useMemo(() => {
    const paddingTotal = spacing.lg * 2;
    const gapsTotal = spacing.md * (COLS - 1);
    const available = screenW - paddingTotal - gapsTotal;
    const w = Math.floor(available / COLS);
    return Math.max(110, w);
  }, [screenW]);

  const pdfUris = useMemo(() => {
    const flat = gridRows
      .flat()
      .map((f) => f.uri)
      .filter(Boolean) as string[];
    return Array.from(new Set(flat));
  }, [gridRows]);

  const shelfWidth = useMemo(() => {
    return screenW - spacing.lg * 2 + spacing.md * 2;
  }, [screenW]);

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <MText variant="heading3" color="textPrimary">
          {t("bookshelf.books")}
        </MText>
        <SectionAddButton
          accessibilityLabel={t("bookshelf.plan.addBook")}
          onPress={() => setModalVisible(true)}
        />
      </View>

      {gridRows.map((row, rIdx) => {
        const missing = Math.max(0, COLS - row.length);

        return (
          <View key={`row-${rIdx}`} style={styles.rowWrap}>
            <View pointerEvents="none" style={styles.shelfAbs}>
              <ShelfPlank idSuffix={`row-${rIdx}`} width={shelfWidth} />
            </View>

            <View style={styles.row}>
              {row.map((file) => {
                const pm = progressMap[file.uri] ?? {};
                const key = `${file.uri}::${today}`;
                const stat = readingStats?.[key];

                return (
                  <View key={file.uri} style={{ width: cellWidth }}>
                    <BookCard
                      file={file}
                      variant="grid"
                      onOpen={() => handleOpenPdf(file)}
                      onDelete={() => handleDeletePdf(file)}
                      onRequestRename={
                        onRequestRename
                          ? () => onRequestRename(file)
                          : undefined
                      }
                      lastPage={pm.lastPage}
                      totalPages={pm.totalPages}
                      todayPages={stat?.pagesTotal ?? 0}
                      todayTargetPages={stat?.targetPages ?? 0}
                    />
                  </View>
                );
              })}

              {Array.from({ length: missing }).map((_, i) => (
                <View
                  key={`empty-${rIdx}-${i}`}
                  style={{ width: cellWidth, opacity: 0 }}
                  pointerEvents="none"
                />
              ))}
            </View>
          </View>
        );
      })}

      <PdfCoverPrewarmer enabled pdfUris={pdfUris} maxToProcess={18} />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: LAST_READ_TO_BOOKS_GAP,
  },
  headerRow: {
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SECTION_HEADER_GAP,
  },

  rowWrap: {
    position: "relative",
    paddingBottom: SHELF_ROW_GAP,
    overflow: "visible",
  },

  row: {
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    gap: spacing.md,
    zIndex: 2,
    elevation: 2,
  },

  shelfAbs: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: BOOK_TO_SHELF_GAP,
    zIndex: 1,
    elevation: 1,
  },
});
