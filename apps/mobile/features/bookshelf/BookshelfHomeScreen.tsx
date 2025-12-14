import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  ScrollView,
  Pressable,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import dayjs from "dayjs";

import {
  listLocalPdfs,
  deleteLocalPdf,
  type LocalPdfFile,
} from "@/utils/getPdfsDirectory";
import { AddPdfModal } from "@/components/ui/pdf/AddPdfModal";
import { useBooksStore } from "@/store/bookshelf/useBooksStore";
import { useReadingStatsStore } from "@/store/bookshelf/useReadingStatsStore";
import { useReadingPlanStore } from "@/store/bookshelf/useReadingPlanStore";
import { ReadingPlanModal } from "@/components/ui/modals/CreatePlanModal";
import { CurrentPlanCard } from "@/features/bookshelf/CurrentPlanCard";
import { BookCard } from "@/components/Books/BookCard";
import { useCurrentPlanInfo } from "@/hooks/useCurrentPlanInfo";
import { AppScreen } from "@/components/AppScreen";
import { BookshelfHeader } from "@/components/BookshelfHeader";
import { bookshelfTheme, iconSizes, MText } from "@budget/ui-native";
import { ShelfHeader } from "@/components/ShelfHeader";
import { IconButton } from "@/components/ui/AppIcon";

const { colors, spacing, radii } = bookshelfTheme;

const bColors = bookshelfTheme.colors;
const bSpacing = bookshelfTheme.spacing;
const bRadii = bookshelfTheme.radii;

const bookshelfHeaderStyles = StyleSheet.create({
  safe: {
    paddingHorizontal: bSpacing.md,
    paddingVertical: bSpacing.sm,
  },
  header: {
    borderBottomWidth: 0,
    backgroundColor: bColors.surface,
    borderRadius: bRadii.md,
    borderWidth: 1,
    borderColor: bColors.borderSubtle,
    shadowColor: bColors.shadowStrong,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontWeight: "600",
  },
});

export default function BookshelfHomeScreen() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const [books, setBooks] = useState<LocalPdfFile[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [planModalVisible, setPlanModalVisible] = useState(false);

  const progressMap = useBooksStore((s) => s.items);
  const readingStats = useReadingStatsStore((s) => s.stats);
  const clearActivePlan = useReadingPlanStore((s) => s.clearActivePlan);
  const ensureTodayPlan = useReadingPlanStore((s) => s.ensureTodayPlan);
  const renameBookInPlan = useReadingPlanStore((s) => s.renameBookInPlan);
  const today = dayjs().format("YYYY-MM-DD");

  const loadBooks = useCallback(async () => {
    const all = await listLocalPdfs();
    setBooks(all);
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    ensureTodayPlan(today);
  }, [ensureTodayPlan, today]);

  const { summary: currentPlanInfo } = useCurrentPlanInfo(books);

  const handleOpenModal = () => setModalVisible(true);
  const handleCloseModal = () => setModalVisible(false);

  const handleOpenPlanModal = () => setPlanModalVisible(true);
  const handleClosePlanModal = () => setPlanModalVisible(false);

  const handleOpenPdf = (item: LocalPdfFile) => {
    router.push({
      pathname: "/(tabs)/bookshelf/pdf/viewer",
      params: { uri: item.uri, name: item.name },
    });
  };

  const handleDeletePdf = (item: LocalPdfFile) => {
    Alert.alert(
      "Delete PDF",
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteLocalPdf(item.uri);
            loadBooks();
          },
        },
      ]
    );
  };

  const handleDeletePlan = () => {
    Alert.alert(
      "Delete plan",
      "Are you sure you want to clear the current plan?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            clearActivePlan();
          },
        },
      ]
    );
  };

  const handlePressPlanCard = () => {
    if (!currentPlanInfo) return;
    if (currentPlanInfo.isCompleted) return;
    if (!currentPlanInfo.currentBookUri) return;

    const book = books.find((b) => b.uri === currentPlanInfo.currentBookUri);
    if (!book) return;

    router.push({
      pathname: "/(tabs)/bookshelf/plan/plan-viewer",
      params: {
        uri: book.uri,
        name: book.name,
        fromPlan: "1",
      },
    });
  };

  async function renameBook(file: LocalPdfFile, newName: string) {
    try {
      const parts = file.name.split(".");
      const ext = parts.length > 1 ? parts[parts.length - 1] : "";
      const baseNewName = newName.trim();

      const finalName = ext
        ? baseNewName.endsWith(`.${ext}`)
          ? baseNewName
          : `${baseNewName}.${ext}`
        : baseNewName;

      const oldUri = file.uri;

      const lastSlashIndex = file.uri.lastIndexOf("/");
      const dirUri = file.uri.slice(0, lastSlashIndex + 1);
      const newUri =
        dirUri + encodeURIComponent(finalName).replace(/%2F/g, "/");

      await FileSystem.moveAsync({
        from: oldUri,
        to: newUri,
      });

      renameBookInPlan(oldUri, newUri, finalName);
      await loadBooks();
    } catch (e) {
      console.warn("Rename error", e);
      Alert.alert(
        "Rename failed",
        "Could not rename this file. Please try a different name."
      );
    }
  }

  const lastReadBooks = useMemo(() => {
    return books
      .map((b) => {
        const meta = progressMap[b.uri] as any;
        const updatedAt: string | undefined = meta?.updatedAt;
        return { book: b, updatedAt };
      })
      .filter((x) => x.updatedAt)
      .sort((a, b) => {
        if (!a.updatedAt && !b.updatedAt) return 0;
        if (!a.updatedAt) return 1;
        if (!b.updatedAt) return -1;
        return a.updatedAt < b.updatedAt ? 1 : -1;
      })
      .map((x) => x.book)
      .slice(0, 12);
  }, [books, progressMap]);

  const gridBooks = useMemo(() => {
    return [...books].sort((a, b) => a.name.localeCompare(b.name));
  }, [books]);

  const gridRows = useMemo(() => {
    const rows: LocalPdfFile[][] = [];
    for (let i = 0; i < gridBooks.length; i += 3) {
      rows.push(gridBooks.slice(i, i + 3));
    }
    return rows;
  }, [gridBooks]);

  return (
    <AppScreen
      title="Bookshelf"
      onPressMenu={() => setSidebarOpen(true)}
      headerCenter={<BookshelfHeader />}
      safeAreaStyle={bookshelfHeaderStyles.safe}
      headerContainerStyle={bookshelfHeaderStyles.header}
      headerTitleStyle={bookshelfHeaderStyles.title}
      headerTitleColor={bColors.textPrimary}
    >
      <View style={styles.container}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <IconButton
            name="notifications-circle-outline"
            size={iconSizes.lg}
            color={colors.textPrimary}
            style={styles.iconButton}
            onPress={() => router.push("/(tabs)/bookshelf/reminders")}
          />
          <IconButton
            name="settings-outline"
            size={iconSizes.lg}
            color={colors.textPrimary}
            style={styles.iconButton}
            onPress={() => router.push("/(tabs)/bookshelf/settings")}
          />

          {/* PLAN SHELF */}
          <View style={styles.shelfSection}>
            <ShelfHeader
              title={`Today's plan`}
              handleOpen={handleOpenPlanModal}
            />

            <View style={styles.shelfInner}>
              <View style={styles.shelfRail} />

              {currentPlanInfo ? (
                <CurrentPlanCard
                  currentPlanInfo={currentPlanInfo}
                  onPress={handlePressPlanCard}
                  onDeletePlan={handleDeletePlan}
                />
              ) : (
                <View style={styles.emptyPlanShelf}>
                  <MText variant="body" color="textSecondary">
                    No active plan. Create one to track your daily reading.
                  </MText>
                </View>
              )}
            </View>
          </View>

          {/* LAST READ SHELF */}
          <View style={styles.shelfSection}>
            <MText
              variant="heading3"
              color="textPrimary"
              style={styles.shelfTitle}
            >
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

          {/* ALL BOOKS GRID */}
          <View style={styles.shelfSection}>
            <ShelfHeader title={"Books"} handleOpen={handleOpenModal} />
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
                                onRename={(newName) =>
                                  renameBook(item, newName)
                                }
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
        </ScrollView>

        <AddPdfModal
          visible={modalVisible}
          onClose={handleCloseModal}
          onPdfImported={() => {
            handleCloseModal();
            loadBooks();
          }}
        />

        <ReadingPlanModal
          visible={planModalVisible}
          onClose={handleClosePlanModal}
          books={books}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing["3xl"],
  },
  shelfSection: {
    marginBottom: spacing.xl,
  },
  shelfTitle: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  shelfInner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    position: "relative",
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
  emptyPlanShelf: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  emptyState: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  listContent: {
    paddingVertical: spacing.lg,
    paddingRight: spacing.lg,
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
  iconButton: {
    marginLeft: 4,
  },
});
