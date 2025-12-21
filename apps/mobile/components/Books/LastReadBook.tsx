import React, { FC } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { bookshelfTheme, MText, radii, spacing } from "@budget/ui-native";
import { BookCard } from "./BookCard";
import { SHELF_PLANK_HEIGHT } from "./ShelfPlankWrapper";
import { ShelfWithPlank } from "./ShelfWithPlank";

const { colors } = bookshelfTheme;
const today = new Date().toISOString().split("T")[0];

type LastReadBookProps = {
  lastReadBooks: Array<{
    uri: string;
    name: string;
    lastOpened: number;
  }>;
  handleOpenPdf: (file: {
    uri: string;
    name: string;
    lastOpened: number;
  }) => void;
  handleDeletePdf: (file: {
    uri: string;
    name: string;
    lastOpened: number;
  }) => void;
  renameBook: (
    file: { uri: string; name: string; lastOpened: number },
    newName: string
  ) => void;

  progressMap: { [uri: string]: { lastPage: number; totalPages: number } };

  // ✅ UPDATED
  readingStats: { [key: string]: { pagesTotal: number; targetPages: number } };
};

export const LastReadBook: FC<LastReadBookProps> = ({
  lastReadBooks,
  handleOpenPdf,
  handleDeletePdf,
  renameBook,
  progressMap,
  readingStats,
}) => {
  const BOOK_SINK = 44;
  const LIFT_UP = Math.max(0, BOOK_SINK - 8);

  return (
    <View style={styles.shelfSection}>
      <MText variant="heading3" color="textPrimary" style={styles.shelfTitle}>
        Last read
      </MText>

      <View style={styles.shelfInner}>
        {lastReadBooks.length === 0 ? (
          <View style={styles.emptyState}>
            <MText color="textSecondary">
              Books you open will appear here.
            </MText>
          </View>
        ) : (
          <ShelfWithPlank
            containerStyle={{
              paddingBottom: SHELF_PLANK_HEIGHT - 12,
              marginTop: -LIFT_UP,
            }}
          >
            <FlatList
              data={lastReadBooks}
              keyExtractor={(item) => item.uri}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: SHELF_PLANK_HEIGHT - 12 },
              ]}
              renderItem={({ item }) => {
                const progress = progressMap[item.uri];

                const statKey = `${item.uri}::${today}`;
                const todayStat = readingStats[statKey];

                const todayPages = todayStat?.pagesTotal ?? 0;
                const todayTargetPages = todayStat?.targetPages ?? 0;

                return (
                  <View
                    style={{
                      transform: [{ translateY: BOOK_SINK }],
                      marginBottom: -2,
                    }}
                  >
                    <BookCard
                      file={item as any}
                      onOpen={() => handleOpenPdf(item)}
                      onDelete={() => handleDeletePdf(item)}
                      lastPage={progress?.lastPage}
                      totalPages={progress?.totalPages}
                      todayPages={todayPages}
                      todayTargetPages={todayTargetPages}
                      onRename={(newName) => renameBook(item, newName)}
                      variant="row"
                    />
                  </View>
                );
              }}
            />
          </ShelfWithPlank>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shelfSection: {
    borderRadius: radii.sm,
  },

  shelfInner: {
    paddingHorizontal: spacing.lg,
    position: "relative",
  },

  shelfTitle: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },

  listContent: {
    paddingRight: spacing.lg,
    alignItems: "flex-end",
  },

  emptyState: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
});
