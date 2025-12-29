// apps/mobile/components/Books/BookList.tsx
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { MText, spacing } from "@budget/ui-native";
import type { LocalPdfFile } from "@/utils/getPdfsDirectory";
import { BookCard } from "./BookCard";

type GridBook = LocalPdfFile & { lastOpened: number };

type Props = {
  setModalVisible: (v: boolean) => void;
  gridRows: GridBook[][];
  handleOpenPdf: (item: LocalPdfFile) => void;
  handleDeletePdf: (item: LocalPdfFile) => void;

  onRequestRename?: (file: LocalPdfFile) => void;

  progressMap: Record<string, { lastPage?: number; totalPages?: number }>;
  readingStats?: Record<string, { pagesTotal: number; targetPages: number }>;
};

export function BookList({
  setModalVisible,
  gridRows,
  handleOpenPdf,
  handleDeletePdf,
  onRequestRename,
  progressMap,
  readingStats,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <View style={{ marginTop: spacing.xl }}>
      <View style={styles.headerRow}>
        <MText variant="heading2" color="textPrimary">
          Books
        </MText>

        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <MText variant="body" color="textSecondary">
            Add
          </MText>
        </TouchableOpacity>
      </View>

      <View style={{ height: spacing.md }} />

      {gridRows.map((row, rIdx) => (
        <View key={rIdx} style={styles.row}>
          {row.map((file) => {
            const pm = progressMap[file.uri] ?? {};
            const key = `${file.uri}::${today}`;
            const stat = readingStats?.[key];

            return (
              <View key={file.uri} style={styles.cell}>
                <BookCard
                  file={file}
                  variant="grid"
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
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  row: {
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  cell: { flex: 1 },
});
