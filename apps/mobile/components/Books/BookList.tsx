import React, { FC, useState } from "react";
import { View, StyleSheet } from "react-native";
import { bookshelfTheme, MText, radii, spacing } from "@budget/ui-native";
import { ShelfHeader } from "../ShelfHeader";
import { BookCard } from "./BookCard";
import { ShelfPlank } from "./ShelfPlank";

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
  const PLANK_H = 46;
  const PLANK_DEPTH = 22;
  const PLANK_THICK = 14;
  const BOOK_SINK = 12;

  const [rowWidth, setRowWidth] = useState(0);

  return (
    <View style={styles.shelfSection}>
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
              <View
                key={rowIndex}
                style={[
                  styles.gridRowContainer,
                  { paddingBottom: PLANK_H - 12 },
                ]}
                onLayout={(e) => {
                  if (!rowWidth) setRowWidth(e.nativeEvent.layout.width);
                }}
              >
                {/* Shelf: bottom */}
                <View style={[styles.plankWrap, { height: PLANK_H }]}>
                  {rowWidth > 0 && (
                    <ShelfPlank
                      width={rowWidth + spacing.lg * 3}
                      height={PLANK_H}
                      thickness={PLANK_THICK}
                      depth={PLANK_DEPTH}
                      skewX={16}
                      skewY={10}
                      radius={4}
                      brightness={0.75}
                      accent
                      accentHeight={2}
                      accentGlow={false}
                    />
                  )}
                </View>

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
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shelfSection: { marginBottom: spacing.xl },
  shelfInner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    paddingRight: spacing.lg,
  },

  gridRowContainer: {
    marginBottom: spacing.lg,
    position: "relative",
  },

  plankWrap: {
    position: "absolute",
    left: -spacing.lg,
    right: -spacing.lg,
    bottom: 0,
  },

  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    minHeight: 160,
  },

  gridItem: {
    width: "38%",
  },
});
