import { colors, MText, radii, spacing } from "@budget/ui-native";
import { View, StyleSheet } from "react-native";
import { ShelfHeader } from "../ShelfHeader";
import { BookCard } from "./BookCard";
import { FC } from "react";

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
  progressMap: {
    [uri: string]: {
      lastPage: number;
      totalPages: number;
    };
  };
  readingStats: {
    [key: string]: {
      pagesRead: number;
      targetPages: number;
    };
  };
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
              <View key={rowIndex} style={styles.gridRowContainer}>
                <View style={styles.gridRowRail} />
                <View style={styles.gridRow}>
                  {row.map((item) => {
                    const progress = progressMap[item.uri];
                    const statKey = `${item.uri}:${today}`;
                    const todayStat = readingStats[statKey];

                    return (
                      <View key={item.uri} style={styles.gridItem}>
                        <BookCard
                          file={item}
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
  shelfTitle: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },

  shelfRail: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xs,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.backgroundSecondary,
    opacity: 0.6,
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
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    position: "relative",
  },

  gridRowRail: {
    position: "absolute",
    left: 0,
    right: spacing.lg,
    bottom: 0,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.backgroundSecondary,
    opacity: 0.6,
  },

  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  gridItem: {
    width: "38%",
  },
});
