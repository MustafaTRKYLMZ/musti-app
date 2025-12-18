import React, { FC } from "react";
import { View, StyleSheet } from "react-native";
import { bookshelfTheme, MText, radii, spacing } from "@budget/ui-native";
import { ShelfHeader } from "../ShelfHeader";
import { BookCard } from "./BookCard";
import { ShelfWithPlank, PLANK_H } from "./ShelfWithPlank";

const { colors } = bookshelfTheme;
const today = new Date().toISOString().split("T")[0];

type BookListProps = {
  setModalVisible: (visible: boolean) => void;
  gridRows: Array<
    Array<{
      uri: string;
      name: string;
      lastOpened: number;
    }>
  >;
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
  readingStats: { [key: string]: { pagesRead: number; targetPages: number } };
};

export const BookList: FC<BookListProps> = ({
  setModalVisible,
  gridRows,
  handleOpenPdf,
  handleDeletePdf,
  renameBook,
  progressMap,
  readingStats,
}) => {
  const BOOK_SINK = 12;
  const PLANK_PADDING = PLANK_H - 12;

  return (
    <View>
      <ShelfHeader title="Books" handleOpen={() => setModalVisible(true)} />
      <View style={styles.shelfInner}>
        {gridRows.length === 0 ? (
          <View style={styles.emptyState}>
            <MText color="textSecondary">
              No books yet. Use the plus button to add one.
            </MText>
          </View>
        ) : (
          <View style={styles.gridContent}>
            {gridRows.map((row, rowIndex) => (
              <ShelfWithPlank
                key={rowIndex}
                containerStyle={[
                  styles.gridRowContainer,
                  { paddingBottom: PLANK_PADDING },
                ]}
              >
                {/* Books */}
                <View style={styles.gridRow}>
                  {row.map((item) => {
                    const progress = progressMap[item.uri];
                    const statKey = `${item.uri}:${today}`;
                    const todayStat = readingStats[statKey];

                    return (
                      <View
                        key={item.uri}
                        style={[
                          styles.gridItem,
                          { transform: [{ translateY: BOOK_SINK }] },
                        ]}
                      >
                        <BookCard
                          file={item as any}
                          onOpen={() => handleOpenPdf(item)}
                          onDelete={() => handleDeletePdf(item)}
                          lastPage={progress?.lastPage}
                          totalPages={progress?.totalPages}
                          todayPages={todayStat?.pagesRead}
                          todayTargetPages={todayStat?.targetPages}
                          onRename={(newName) => renameBook(item, newName)}
                          variant="grid"
                        />
                      </View>
                    );
                  })}
                </View>
              </ShelfWithPlank>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shelfInner: {
    paddingHorizontal: spacing.lg,
    position: "relative",
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

  gridContent: {
    paddingBottom: spacing.lg,
    paddingRight: spacing.lg,
  },

  gridRowContainer: {
    position: "relative",
  },

  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  gridItem: {
    width: "38%",
  },
});
