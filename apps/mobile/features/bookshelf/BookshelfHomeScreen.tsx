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
import { BookCard } from "@/components/Books/BookCard";
import { AppScreen } from "@/components/AppScreen";
import { BookshelfHeader } from "@/components/BookshelfHeader";
import { bookshelfTheme, iconSizes, MText } from "@budget/ui-native";
import { ShelfHeader } from "@/components/ShelfHeader";
import { IconButton } from "@/components/ui/AppIcon";
import { AppSwitcherButton } from "@/components/AppSwitcherButton";
import { PlanOptionsMenu } from "@/components/PlanOptionsMenu";

const { colors, spacing, radii } = bookshelfTheme;

const bColors = bookshelfTheme.colors;
const bSpacing = bookshelfTheme.spacing;
const bRadii = bookshelfTheme.radii;

const bookshelfHeaderStyles = StyleSheet.create({
  safe: { paddingHorizontal: bSpacing.md, paddingVertical: bSpacing.sm },
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
  title: { fontWeight: "600" },
});

export default function BookshelfHomeScreen() {
  const router = useRouter();

  const [books, setBooks] = useState<LocalPdfFile[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [planModalVisible, setPlanModalVisible] = useState(false);

  const progressMap = useBooksStore((s) => s.items);
  const readingStats = useReadingStatsStore((s) => s.stats);

  const plans = useReadingPlanStore((s) => s.plans);
  const deletePlan = useReadingPlanStore((s) => s.deletePlan);
  const ensureTodayPlan = useReadingPlanStore((s) => s.ensureTodayPlan);
  const renameBookInPlan = useReadingPlanStore((s) => s.renameBookInPlan);

  const today = dayjs().format("YYYY-MM-DD");

  // ✅ prevents chip press from opening plan when user pressed 3-dot
  const suppressNextPlanOpenRef = React.useRef(false);

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

  const handleOpenPdf = (item: LocalPdfFile) => {
    router.push({
      pathname: "/(tabs)/bookshelf/pdf/viewer",
      params: {
        uri: encodeURIComponent(item.uri),
        name: encodeURIComponent(item.name),
      },
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

  const handleDeletePlan = (planId: string) => {
    const planName = plans.find((p) => p.id === planId)?.name ?? "this plan";

    Alert.alert("Delete plan", `Delete "${planName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deletePlan(planId),
      },
    ]);
  };

  const openPlanDirect = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan || !plan.items.length) return;

    // first remaining book today; fallback first
    let next = plan.items[0];
    for (const it of plan.items) {
      const pb = plan.perBook?.[it.bookUri];
      const read = pb?.pagesReadToday ?? 0;
      const target = it.pagesPerDay ?? 0;
      if (Math.max(0, target - read) > 0) {
        next = it;
        break;
      }
    }

    router.push({
      pathname: "/(tabs)/bookshelf/plan/plan-viewer",
      params: {
        planId,
        uri: encodeURIComponent(next.bookUri),
        name: encodeURIComponent(next.bookName),
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

      await FileSystem.moveAsync({ from: oldUri, to: newUri });

      // ✅ rename across all plans
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
      .sort((a, b) => (a.updatedAt! < b.updatedAt! ? 1 : -1))
      .map((x) => x.book)
      .slice(0, 12);
  }, [books, progressMap]);

  const gridBooks = useMemo(
    () => [...books].sort((a, b) => a.name.localeCompare(b.name)),
    [books]
  );

  const gridRows = useMemo(() => {
    const rows: LocalPdfFile[][] = [];
    for (let i = 0; i < gridBooks.length; i += 3)
      rows.push(gridBooks.slice(i, i + 3));
    return rows;
  }, [gridBooks]);

  return (
    <AppScreen
      title="Bookshelf"
      headerCenter={<BookshelfHeader />}
      headerRight={
        <View style={styles.headerActions}>
          <IconButton
            name="notifications-circle-outline"
            size={iconSizes.lg}
            color={bColors.textPrimary}
            onPress={() => router.push("/(tabs)/bookshelf/reminders")}
          />
          <IconButton
            name="settings-outline"
            size={iconSizes.lg}
            color={bColors.textPrimary}
            onPress={() => router.push("/(tabs)/bookshelf/settings")}
          />
          <AppSwitcherButton />
        </View>
      }
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
          {/* PLANS */}
          <View style={styles.shelfSection}>
            <ShelfHeader
              title="Plans"
              handleOpen={() => setPlanModalVisible(true)}
            />
            <View style={styles.shelfInner}>
              <View style={styles.shelfRail} />

              {plans.length === 0 ? (
                <View style={styles.emptyPlanShelf}>
                  <MText variant="body" color="textSecondary">
                    No plans yet. Create one to track your reading.
                  </MText>
                </View>
              ) : (
                <FlatList
                  data={plans}
                  keyExtractor={(p) => p.id}
                  horizontal
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.planListContent}
                  renderItem={({ item }) => {
                    const totalTarget = item.items.reduce(
                      (s, it) => s + (it.pagesPerDay || 0),
                      0
                    );
                    const done = item.totalReadToday || 0;

                    return (
                      <Pressable
                        onPress={() => {
                          if (suppressNextPlanOpenRef.current) return;
                          openPlanDirect(item.id);
                        }}
                        style={[
                          styles.planChip,
                          {
                            borderColor: colors.borderSubtle,
                            backgroundColor: colors.surface,
                          },
                        ]}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: spacing.sm,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <MText
                              variant="bodyStrong"
                              color="textPrimary"
                              numberOfLines={1}
                              style={{ maxWidth: 180 }}
                            >
                              {item.name}
                            </MText>
                            <MText
                              variant="caption"
                              color="textSecondary"
                              style={{ marginTop: 2 }}
                            >
                              {done} / {totalTarget} pages
                            </MText>
                          </View>

                          {/* ✅ 3-dot popover menu */}
                          <Pressable
                            onPress={() => {
                              suppressNextPlanOpenRef.current = true;
                              setTimeout(
                                () => (suppressNextPlanOpenRef.current = false),
                                300
                              );
                            }}
                            hitSlop={10}
                          >
                            <PlanOptionsMenu
                              onEdit={() => {
                                router.push({
                                  pathname: "/(tabs)/bookshelf/plan/edit-plan",
                                  params: { planId: item.id },
                                });
                              }}
                              onDelete={() => handleDeletePlan(item.id)}
                            />
                          </Pressable>
                        </View>

                        <MText
                          variant="caption"
                          color="textSecondary"
                          style={{ marginTop: spacing.xs }}
                        >
                          {item.items.length} book
                          {item.items.length === 1 ? "" : "s"}
                        </MText>
                      </Pressable>
                    );
                  }}
                />
              )}
            </View>
          </View>

          {/* LAST READ */}
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

          {/* ALL BOOKS */}
          <View style={styles.shelfSection}>
            <ShelfHeader
              title="Books"
              handleOpen={() => setModalVisible(true)}
            />
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
          onClose={() => setModalVisible(false)}
          onPdfImported={() => {
            setModalVisible(false);
            loadBooks();
          }}
        />

        <ReadingPlanModal
          visible={planModalVisible}
          onClose={() => setPlanModalVisible(false)}
          books={books}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing["3xl"],
  },

  shelfSection: { marginBottom: spacing.xl },

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

  planListContent: {
    paddingVertical: spacing.sm,
    paddingRight: spacing.lg,
  },

  planChip: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    minWidth: 220,
  },

  emptyPlanShelf: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginTop: spacing.xs,
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
});
