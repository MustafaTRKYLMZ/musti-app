import React, { useMemo } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { MText, spacing } from "@budget/ui-native";
import type { LocalPdfFile } from "@/utils/getPdfsDirectory";
import { BookCard } from "./BookCard";
import { PdfCoverPrewarmer } from "../ui/pdf/PdfCoverPrewarmer";

type Props = {
  lastReadBooks: { uri: string; name: string; lastOpened: number }[];
  handleOpenPdf: (item: LocalPdfFile) => void;
  handleDeletePdf: (item: LocalPdfFile) => void;
  onRequestRename?: (file: LocalPdfFile) => void;
  progressMap: Record<string, { lastPage?: number; totalPages?: number }>;
  readingStats?: Record<string, { pagesTotal: number; targetPages: number }>;
};

const FOOTER_H = 64;
const FOOTER_OVERLAP = FOOTER_H / 2;

export const LastReadBook = ({
  lastReadBooks,
  handleOpenPdf,
  handleDeletePdf,
  onRequestRename,
  progressMap,
  readingStats,
}: Props) => {
  const today = new Date().toISOString().slice(0, 10);

  if (!lastReadBooks.length) return null;

  const pdfUris = useMemo(() => {
    const flat = lastReadBooks.map((b) => b.uri).filter(Boolean) as string[];
    return Array.from(new Set(flat));
  }, [lastReadBooks]);

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <MText variant="heading2" color="textPrimary">
          Last read
        </MText>
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

      <PdfCoverPrewarmer enabled pdfUris={pdfUris} maxToProcess={18} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    marginTop: spacing.xl,
    overflow: "visible",
  },

  headerRow: {
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  list: {
    overflow: "visible",
  },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md + FOOTER_OVERLAP,
  },
});
