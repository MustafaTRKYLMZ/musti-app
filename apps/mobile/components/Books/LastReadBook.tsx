import { bookshelfTheme, MText, radii, spacing } from "@budget/ui-native";
import { View, FlatList, StyleSheet } from "react-native";
import { BookCard } from "./BookCard";
import { FC } from "react";

const { colors } = bookshelfTheme;

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
const today = new Date().toISOString().split("T")[0];

export const LastReadBook: FC<LastReadBookProps> = ({
  lastReadBooks,
  handleOpenPdf,
  handleDeletePdf,
  renameBook,
  progressMap,
  readingStats,
}) => {
  return (
    <View style={styles.shelfSection}>
      <MText variant="heading3" color="textPrimary" style={styles.shelfTitle}>
        Last read
      </MText>

      <View style={styles.shelfInner}>
        <View style={styles.shelfRail} />

        {lastReadBooks.length === 0 ? (
          <View style={styles.emptyState}>
            <MText color="textSecondary">
              Books you open will appear here.
            </MText>
          </View>
        ) : (
          <FlatList
            data={lastReadBooks}
            keyExtractor={(item) => item.uri}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const progress = progressMap[item.uri];
              const statKey = `${item.uri}:${today}`;
              const todayStat = readingStats[statKey];

              return (
                <BookCard
                  file={item}
                  onOpen={() => handleOpenPdf(item)}
                  onDelete={() => handleDeletePdf(item)}
                  lastPage={progress?.lastPage}
                  totalPages={progress?.totalPages}
                  todayPages={todayStat?.pagesRead}
                  todayTargetPages={todayStat?.targetPages}
                  onRename={(newName) => renameBook(item, newName)}
                  variant="row"
                />
              );
            }}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: spacing.lg,
    paddingRight: spacing.lg,
  },
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
});
