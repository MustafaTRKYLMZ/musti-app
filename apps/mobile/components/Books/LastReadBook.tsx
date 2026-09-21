import React, { useMemo } from "react";
import { View, StyleSheet, FlatList, useWindowDimensions } from "react-native";
import { useTranslation } from "@musti/core";
import { MText, spacing } from "@musti/ui-native";
import type { LocalPdfFile } from "@/utils/getPdfsDirectory";
import { BookCard } from "./BookCard";
import { PdfCoverPrewarmer } from "../ui/pdf/PdfCoverPrewarmer";
import { ShelfPlank } from "./ShelfPlank";
import { BOOK_TO_SHELF_GAP, SECTION_HEADER_GAP } from "./shelfLayout";

type Props = {
  lastReadBooks: { uri: string; name: string; lastOpened: number }[];
  handleOpenPdf: (item: LocalPdfFile) => void;
  handleDeletePdf: (item: LocalPdfFile) => void;
  onRequestRename?: (file: LocalPdfFile) => void;
  progressMap: Record<string, { lastPage?: number; totalPages?: number }>;
  readingStats?: Record<string, { pagesTotal: number; targetPages: number }>;
};

export const LastReadBook = ({
  lastReadBooks,
  handleOpenPdf,
  handleDeletePdf,
  onRequestRename,
  progressMap,
  readingStats,
}: Props) => {
  const { t } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);
  const { width: screenW } = useWindowDimensions();

  if (!lastReadBooks.length) return null;

  const pdfUris = useMemo(() => {
    const flat = lastReadBooks.map((b) => b.uri).filter(Boolean) as string[];
    return Array.from(new Set(flat));
  }, [lastReadBooks]);

  const shelfWidth = useMemo(() => {
    return screenW - spacing.lg * 2 + spacing.md * 2;
  }, [screenW]);

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <MText variant="heading3" color="textPrimary">
          {t("bookshelf.lastRead")}
        </MText>
      </View>

      <View style={styles.listWrap}>
        <View pointerEvents="none" style={styles.shelfAbs}>
          <ShelfPlank idSuffix="last-read" width={shelfWidth} />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={lastReadBooks}
          keyExtractor={(x) => x.uri}
          renderItem={({ item }) => {
            const file = { uri: item.uri, name: item.name } as LocalPdfFile;
            const pm = progressMap[file.uri] ?? {};
            const key = `${file.uri}::${today}`;
            const stat = readingStats?.[key];

            return (
              <BookCard
                file={file}
                variant="row"
                onOpen={() => handleOpenPdf(file)}
                onDelete={() => handleDeletePdf(file)}
                onRequestRename={
                  onRequestRename ? () => onRequestRename(file) : undefined
                }
                lastPage={pm.lastPage}
                totalPages={pm.totalPages}
                todayPages={stat?.pagesTotal ?? 0}
                todayTargetPages={stat?.targetPages ?? 0}
              />
            );
          }}
        />
      </View>

      <PdfCoverPrewarmer enabled pdfUris={pdfUris} maxToProcess={18} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    marginTop: spacing.md,
    overflow: "visible",
  },

  headerRow: {
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SECTION_HEADER_GAP,
  },

  listWrap: {
    position: "relative",
    overflow: "visible",
    paddingBottom: spacing.sm,
  },

  list: {
    overflow: "visible",
    zIndex: 2,
    elevation: 2,
  },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
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
