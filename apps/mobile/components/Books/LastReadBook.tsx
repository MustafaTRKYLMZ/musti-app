import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { MText, spacing } from "@budget/ui-native";
import type { LocalPdfFile } from "@/utils/getPdfsDirectory";
import { BookCard } from "./BookCard";

type Props = {
  lastReadBooks: { uri: string; name: string; lastOpened: number }[];
  handleOpenPdf: (item: LocalPdfFile) => void;
  handleDeletePdf: (item: LocalPdfFile) => void;

  onRequestRename?: (file: LocalPdfFile) => void;

  progressMap: Record<string, { lastPage?: number; totalPages?: number }>;
  readingStats?: Record<string, { pagesTotal: number; targetPages: number }>;
};

export function LastReadBook({
  lastReadBooks,
  handleOpenPdf,
  handleDeletePdf,
  onRequestRename,
  progressMap,
  readingStats,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);

  if (!lastReadBooks.length) return null;

  return (
    <View style={{ marginTop: spacing.xl }}>
      <View style={styles.headerRow}>
        <MText variant="heading2" color="textPrimary">
          Last read
        </MText>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        }}
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
  );
}

const styles = StyleSheet.create({
  headerRow: {
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
