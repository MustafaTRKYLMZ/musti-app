import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { useReadingTargetsStore } from "@/store/bookshelf/useReadingTargetsStore";
import { pickActiveItem } from "@/utils/pickActiveItem";

import { ReadingPlanModal } from "@/components/ui/modals/CreatePlanModal";
import { AppScreen } from "@/components/AppScreen";
import { BookshelfHeader } from "@/components/Books/BookshelfHeader";
import { bookshelfTheme, iconSizes } from "@budget/ui-native";
import { IconButton } from "@/components/ui/AppIcon";
import { AppSwitcherButton } from "@/components/AppSwitcherButton";
import { LastReadBook } from "@/components/Books/LastReadBook";
import { PlanList } from "@/components/Books/PlanList";
import { BookList } from "../Books/BookList";
import { BookshelfTabs } from "../Books/BookshelfTabs";
import { TargetList } from "../Books/TargetList";
import { CreateTargetModal } from "../ui/modals/CreateTargetModal";
import { useBookshelfTabsStore } from "@/store/bookshelf/useBookshelfTabsStore";

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
  const selectedTab = useBookshelfTabsStore((s) => s.selected);
  const setSelectedTab = useBookshelfTabsStore((s) => s.setSelected);

  const [books, setBooks] = useState<LocalPdfFile[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [targetModalVisible, setTargetModalVisible] = useState(false);
  const [createTargetInitialBookUri, setCreateTargetInitialBookUri] = useState<
    string | null
  >(null);

  const progressMap = useBooksStore((s) => s.items);

  // ✅ stats v3
  const byBookDate = useReadingStatsStore((s) => s.byBookDate);

  // plans
  const plans = useReadingPlanStore((s) => s.plans);
  const deletePlan = useReadingPlanStore((s) => s.deletePlan);
  const ensureTodayPlan = useReadingPlanStore((s) => s.ensureTodayPlan);
  const renameBookInPlan = useReadingPlanStore((s) => s.renameBookInPlan);

  // targets
  const hydrateTargets = useReadingTargetsStore((s) => s.hydrate);
  const targetsHydrated = useReadingTargetsStore((s) => s.hydrated);
  const targets = useReadingTargetsStore((s) => s.targets);

  useEffect(() => {
    if (!targetsHydrated) hydrateTargets();
  }, [targetsHydrated, hydrateTargets]);

  const params = useLocalSearchParams<{
    openCreateTarget?: string;
    targetBookUri?: string;
  }>();

  useEffect(() => {
    if (params.openCreateTarget !== "1") return;

    const bookUri = params.targetBookUri
      ? decodeURIComponent(params.targetBookUri)
      : null;

    setTargetModalVisible(true);
    if (bookUri) setCreateTargetInitialBookUri(bookUri);
  }, [params.openCreateTarget, params.targetBookUri]);

  const today = dayjs().format("YYYY-MM-DD");

  // ✅ prevents chip press from opening plan when user pressed 3-dot
  const suppressNextPlanOpenRef = React.useRef(false);

  // ✅ plan daily targets by bookUri (MAX if multiple)
  const planTargetByBookUri = useMemo(() => {
    const map: Record<string, number> = {};

    for (const plan of plans ?? []) {
      for (const it of plan.items ?? []) {
        const uri = it.bookUri;
        const t = Number(it.pagesPerDay ?? 0) || 0;
        if (!uri || t <= 0) continue;

        map[uri] = Math.max(map[uri] ?? 0, t);
      }
    }

    return map;
  }, [plans]);

  // ✅ target (range) targets by bookUri (MAX if multiple targets)
  // target pages = endPage - startPage (total range)
  const targetTargetByBookUri = useMemo(() => {
    const map: Record<string, number> = {};
    if (!targetsHydrated) return map;

    for (const t of targets ?? []) {
      const active = pickActiveItem(t);
      if (!active?.bookUri) continue;

      const start = Math.max(1, Math.floor(active.startPage ?? 1));
      const end = Math.max(1, Math.floor(active.endPage ?? start));
      const total = Math.max(0, end - start);

      if (total <= 0) continue;
      map[active.bookUri] = Math.max(map[active.bookUri] ?? 0, total);
    }

    return map;
  }, [targetsHydrated, targets]);

  // ✅ final target by bookUri (prefer showing something meaningful)
  // We take MAX(planDailyTarget, targetRangeTarget)
  const todayTargetByBookUri = useMemo(() => {
    const out: Record<string, number> = {};
    const allUris = new Set<string>([
      ...Object.keys(planTargetByBookUri),
      ...Object.keys(targetTargetByBookUri),
    ]);

    for (const uri of allUris) {
      out[uri] = Math.max(
        planTargetByBookUri[uri] ?? 0,
        targetTargetByBookUri[uri] ?? 0
      );
    }
    return out;
  }, [planTargetByBookUri, targetTargetByBookUri]);

  // ✅ Shape adapter for BookCard UI (LastReadBook/BookList)
  // key: `${bookUri}::${date}` -> { pagesTotal, targetPages }
  const readingStatsForCards = useMemo(() => {
    const out: Record<string, { pagesTotal: number; targetPages: number }> = {};

    // pagesTotal from stats
    for (const [key, stat] of Object.entries(byBookDate ?? {})) {
      out[key] = {
        pagesTotal: stat?.pagesTotal ?? 0,
        targetPages: 0,
      };
    }

    // targetPages for today (bookUri -> `${bookUri}::${today}`)
    for (const [bookUri, targetPages] of Object.entries(todayTargetByBookUri)) {
      const k = `${bookUri}::${today}`;
      const cur = out[k];
      out[k] = {
        pagesTotal: cur?.pagesTotal ?? 0,
        targetPages: Number(targetPages ?? 0) || 0,
      };
    }

    return out;
  }, [byBookDate, todayTargetByBookUri, today]);

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
            name="stats-chart-outline"
            size={iconSizes.lg}
            color={bColors.textPrimary}
            onPress={() => router.push("/(tabs)/bookshelf/stats")}
          />

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
          <BookshelfTabs value={selectedTab} onChange={setSelectedTab} />

          {/* PLANS / TARGETS */}
          {selectedTab === "plans" ? (
            <PlanList
              setPlanModalVisible={setPlanModalVisible}
              plans={plans}
              openPlanDirect={openPlanDirect}
              handleDeletePlan={handleDeletePlan}
              suppressNextPlanOpenRef={suppressNextPlanOpenRef}
            />
          ) : (
            <TargetList
              onOpenCreate={() => setTargetModalVisible(true)}
              onOpenChapters={(bookUri, bookName) => {
                setTargetModalVisible(false);

                const start = Number(progressMap[bookUri]?.lastPage ?? 1) || 1;
                router.push({
                  pathname: "/(tabs)/bookshelf/pdf/viewer",
                  params: {
                    uri: encodeURIComponent(bookUri),
                    name: encodeURIComponent(bookName),
                    openSections: "1",
                    jumpPage: String(start),
                    returnTo: "createTarget",
                    returnBookUri: encodeURIComponent(bookUri),
                  },
                });
              }}
            />
          )}

          {/* LAST READ */}
          <LastReadBook
            readingStats={readingStatsForCards}
            lastReadBooks={lastReadBooks.map((book) => ({
              uri: book.uri,
              name: book.name,
              lastOpened: Number(progressMap[book.uri]?.updatedAt) || 0,
            }))}
            handleOpenPdf={handleOpenPdf}
            handleDeletePdf={handleDeletePdf}
            renameBook={renameBook}
            progressMap={Object.fromEntries(
              Object.entries(progressMap).map(([key, value]) => [
                key,
                {
                  ...value,
                  totalPages: value.totalPages ?? 0,
                },
              ])
            )}
          />

          {/* ALL BOOKS */}
          <BookList
            readingStats={readingStatsForCards}
            setModalVisible={setModalVisible}
            gridRows={gridRows.map((row) =>
              row.map((book) => ({
                ...book,
                lastOpened: Number(progressMap[book.uri]?.updatedAt) || 0,
              }))
            )}
            handleOpenPdf={handleOpenPdf}
            handleDeletePdf={handleDeletePdf}
            renameBook={renameBook}
            progressMap={Object.fromEntries(
              Object.entries(progressMap).map(([key, value]) => [
                key,
                {
                  ...value,
                  totalPages: value.totalPages ?? 0,
                },
              ])
            )}
          />
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

        <CreateTargetModal
          visible={targetModalVisible}
          onClose={() => setTargetModalVisible(false)}
          books={books}
          initialBookUri={createTargetInitialBookUri}
          onOpenChapters={(bookUri, bookName) => {
            setTargetModalVisible(false);

            const start = Number(progressMap[bookUri]?.lastPage ?? 1) || 1;
            router.push({
              pathname: "/(tabs)/bookshelf/pdf/viewer",
              params: {
                uri: encodeURIComponent(bookUri),
                name: encodeURIComponent(bookName),
                openSections: "1",
                jumpPage: String(start),
                returnTo: "createTarget",
                returnBookUri: encodeURIComponent(bookUri),
              },
            });
          }}
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
});
