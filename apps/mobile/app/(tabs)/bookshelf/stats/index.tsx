import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  ScrollView,
} from "react-native";
import dayjs from "dayjs";
import { useRouter } from "expo-router";

import { AppScreen } from "@/components/AppScreen";
import { IconButton, BaseIcon } from "@/components/ui/AppIcon";
import {
  MText,
  spacing,
  radii,
  iconSizes,
  useTheme,
  Card,
} from "@budget/ui-native";

import { listLocalPdfs, type LocalPdfFile } from "@/utils/getPdfsDirectory";
import { useReadingStatsStore } from "@/store/bookshelf/useReadingStatsStore";
import { toNonNegativeInt } from "@/utils/toNonNegativeInt";
import { formatModeParts } from "@/utils/formatModeParts";
import { guessNameFromUri } from "@/utils/guessNameFromUri";
import { ReadingMode } from "@budget/core";

type BookRow = {
  bookUri: string;
  bookName: string;
  pagesTotal: number;
  pagesByMode: Record<ReadingMode, number>;
};

export default function StatsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  // ✅ Amsterdam-safe local date
  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);

  // raw stats
  const byDate = useReadingStatsStore((s) => s.byDate);
  const byBookDate = useReadingStatsStore((s) => s.byBookDate);

  // selectors (already in your store)
  const getWeekTotal = useReadingStatsStore((s) => s.getWeekTotal);
  const getMonthTotal = useReadingStatsStore((s) => s.getMonthTotal);
  const getBookWeekTotal = useReadingStatsStore((s) => s.getBookWeekTotal);
  const getBookMonthTotal = useReadingStatsStore((s) => s.getBookMonthTotal);

  const [books, setBooks] = useState<LocalPdfFile[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const all = await listLocalPdfs();
        if (mounted) setBooks(all);
      } catch {
        if (mounted) setBooks([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const bookNameByUri = useMemo(() => {
    const map: Record<string, string> = {};
    for (const b of books) map[b.uri] = b.name;
    return map;
  }, [books]);

  // ✅ book detail page push
  const openBookStats = useCallback(
    (bookUri: string) => {
      if (!bookUri) return;
      router.push({
        pathname: "/(tabs)/bookshelf/stats/stats-book",
        params: { uri: encodeURIComponent(bookUri) },
      });
    },
    [router]
  );

  // =========================
  // TODAY summary
  // =========================
  const todayGlobal = byDate?.[today];
  const todayTotal = toNonNegativeInt(todayGlobal?.pagesTotal ?? 0);

  const todayModeParts = useMemo(() => {
    return formatModeParts(
      (todayGlobal?.pagesByMode ?? { normal: 0, plan: 0, target: 0 }) as Record<
        ReadingMode,
        number
      >
    );
  }, [todayGlobal]);

  // =========================
  // TODAY books (Top 7)
  // =========================
  const todayBooksTop7: BookRow[] = useMemo(() => {
    const rows: BookRow[] = [];

    for (const stat of Object.values(byBookDate ?? {})) {
      if (!stat?.bookUri) continue;
      if (stat.date !== today) continue;

      const bookUri = stat.bookUri;
      const name = bookNameByUri[bookUri] ?? guessNameFromUri(bookUri);

      rows.push({
        bookUri,
        bookName: name,
        pagesTotal: toNonNegativeInt(stat.pagesTotal ?? 0),
        pagesByMode: (stat.pagesByMode ?? {
          normal: 0,
          plan: 0,
          target: 0,
        }) as Record<ReadingMode, number>,
      });
    }

    rows.sort((a, b) => (b.pagesTotal ?? 0) - (a.pagesTotal ?? 0));
    return rows.slice(0, 7);
  }, [byBookDate, today, bookNameByUri]);

  // =========================
  // WEEK + MONTH totals
  // =========================
  const weekTotal = useMemo(
    () => toNonNegativeInt(getWeekTotal(today)),
    [getWeekTotal, today]
  );
  const monthTotal = useMemo(
    () => toNonNegativeInt(getMonthTotal(today)),
    [getMonthTotal, today]
  );

  // Top 7 books in last week / month
  const weekTop7 = useMemo(() => {
    const rows: Array<{ bookUri: string; bookName: string; pages: number }> =
      [];
    for (const b of books) {
      const pages = toNonNegativeInt(getBookWeekTotal(b.uri, today));
      if (pages <= 0) continue;
      rows.push({ bookUri: b.uri, bookName: b.name, pages });
    }
    rows.sort((a, b) => b.pages - a.pages);
    return rows.slice(0, 7);
  }, [books, getBookWeekTotal, today]);

  const monthTop7 = useMemo(() => {
    const rows: Array<{ bookUri: string; bookName: string; pages: number }> =
      [];
    for (const b of books) {
      const pages = toNonNegativeInt(getBookMonthTotal(b.uri, today));
      if (pages <= 0) continue;
      rows.push({ bookUri: b.uri, bookName: b.name, pages });
    }
    rows.sort((a, b) => b.pages - a.pages);
    return rows.slice(0, 7);
  }, [books, getBookMonthTotal, today]);

  // -------------------------
  // UI helpers
  // -------------------------
  const renderBookRow = useCallback(
    ({ item }: { item: BookRow }) => {
      const parts = formatModeParts(item.pagesByMode);

      return (
        <Pressable onPress={() => openBookStats(item.bookUri)}>
          <Card
            style={[
              styles.rowCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.rowTop}>
              <View style={{ flex: 1 }}>
                <MText
                  variant="bodyStrong"
                  color="textPrimary"
                  numberOfLines={1}
                >
                  {item.bookName}
                </MText>
                <MText
                  variant="caption"
                  color="textSecondary"
                  numberOfLines={1}
                >
                  {item.pagesTotal} pages
                </MText>
              </View>

              <View
                style={[
                  styles.totalPill,
                  {
                    backgroundColor: colors.surfaceStrong,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <MText
                  variant="caption"
                  color="textPrimary"
                  style={{ fontWeight: "900" }}
                >
                  {item.pagesTotal}
                </MText>
              </View>
            </View>

            {parts.length > 0 ? (
              <View style={styles.modesRow}>
                {parts.map((p) => (
                  <View key={p.mode} style={styles.modeChip}>
                    <BaseIcon
                      name={p.icon as any}
                      size={12}
                      color={colors.textSecondary}
                    />
                    <MText variant="caption" color="textSecondary">
                      {p.value}
                    </MText>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>
        </Pressable>
      );
    },
    [colors, openBookStats]
  );

  const renderSimpleTopRow = useCallback(
    ({
      item,
    }: {
      item: { bookUri: string; bookName: string; pages: number };
    }) => {
      return (
        <Pressable onPress={() => openBookStats(item.bookUri)}>
          <Card
            style={[
              styles.simpleRowCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <MText variant="bodyStrong" color="textPrimary" numberOfLines={1}>
              {item.bookName}
            </MText>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xs,
              }}
            >
              <BaseIcon
                name="document-text-outline"
                size={12}
                color={colors.textSecondary}
              />
              <MText variant="caption" color="textSecondary">
                {item.pages} pages
              </MText>
            </View>
          </Card>
        </Pressable>
      );
    },
    [colors, openBookStats]
  );

  // prebuild simple data lists
  const weekSimple = useMemo(
    () =>
      weekTop7.map((x) => ({
        bookUri: x.bookUri,
        bookName: x.bookName,
        pages: x.pages,
      })),
    [weekTop7]
  );
  const monthSimple = useMemo(
    () =>
      monthTop7.map((x) => ({
        bookUri: x.bookUri,
        bookName: x.bookName,
        pages: x.pages,
      })),
    [monthTop7]
  );

  return (
    <AppScreen
      title="Stats"
      headerLeft={
        <IconButton
          name="chevron-back"
          size={iconSizes.lg}
          color={colors.textPrimary}
          onPress={() => router.back()}
        />
      }
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
        showsVerticalScrollIndicator={false}
      >
        {/* ===================== */}
        {/* TODAY SUMMARY */}
        {/* ===================== */}
        <Card
          style={[
            styles.summaryCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <View style={styles.summaryTitleRow}>
            <BaseIcon
              name="today-outline"
              size={16}
              color={colors.textSecondary}
            />
            <MText variant="bodyStrong" color="textPrimary">
              Today
            </MText>
            <MText
              variant="caption"
              color="textSecondary"
              style={{ marginLeft: "auto" }}
            >
              {today}
            </MText>
          </View>

          <MText
            variant="heading2"
            color="textPrimary"
            style={{ marginTop: spacing.xs, fontWeight: "900" }}
          >
            {todayTotal} pages
          </MText>

          {todayModeParts.length > 0 ? (
            <View style={styles.modeBreakdown}>
              {todayModeParts.map((p) => (
                <View
                  key={p.mode}
                  style={[
                    styles.modeBreakdownItem,
                    {
                      backgroundColor: colors.surfaceStrong,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <BaseIcon
                    name={p.icon as any}
                    size={14}
                    color={colors.textSecondary}
                  />
                  <MText variant="caption" color="textSecondary">
                    {p.label}:
                  </MText>
                  <MText
                    variant="caption"
                    color="textPrimary"
                    style={{ fontWeight: "900" }}
                  >
                    {p.value}
                  </MText>
                </View>
              ))}
            </View>
          ) : (
            <MText
              variant="caption"
              color="textSecondary"
              style={{ marginTop: spacing.sm }}
            >
              No pages tracked today yet.
            </MText>
          )}
        </Card>

        {/* ===================== */}
        {/* TODAY TOP 7 BOOKS */}
        {/* ===================== */}
        <View style={styles.sectionHeader}>
          <MText variant="bodyStrong" color="textPrimary">
            Today · Top 7 books
          </MText>
          <MText variant="caption" color="textSecondary">
            {todayBooksTop7.length}
          </MText>
        </View>

        {todayBooksTop7.length === 0 ? (
          <Card
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <MText variant="body" color="textSecondary">
              No reading logged for today.
            </MText>
          </Card>
        ) : (
          <FlatList
            data={todayBooksTop7}
            keyExtractor={(x) => x.bookUri}
            renderItem={renderBookRow}
            scrollEnabled={false}
          />
        )}

        {/* ===================== */}
        {/* LAST WEEK */}
        {/* ===================== */}
        <Card
          style={[
            styles.periodCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <View style={styles.periodHeader}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xs,
              }}
            >
              <BaseIcon
                name="time-outline"
                size={16}
                color={colors.textSecondary}
              />
              <MText variant="bodyStrong" color="textPrimary">
                Last 7 days
              </MText>
            </View>
            <MText
              variant="bodyStrong"
              color="textPrimary"
              style={{ fontWeight: "900" }}
            >
              {weekTotal}
            </MText>
          </View>

          <MText
            variant="caption"
            color="textSecondary"
            style={{ marginTop: 2 }}
          >
            Total pages in last 7 days
          </MText>

          <View style={styles.periodTopHeader}>
            <MText variant="bodyStrong" color="textPrimary">
              Top 7 books
            </MText>
            <MText variant="caption" color="textSecondary">
              {weekSimple.length}
            </MText>
          </View>

          {weekSimple.length === 0 ? (
            <MText
              variant="caption"
              color="textSecondary"
              style={{ marginTop: spacing.sm }}
            >
              No reading found in the last 7 days.
            </MText>
          ) : (
            <FlatList
              data={weekSimple}
              keyExtractor={(x) => x.bookUri}
              renderItem={renderSimpleTopRow}
              scrollEnabled={false}
              contentContainerStyle={{ marginTop: spacing.sm }}
            />
          )}
        </Card>

        {/* ===================== */}
        {/* LAST MONTH */}
        {/* ===================== */}
        <Card
          style={[
            styles.periodCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <View style={styles.periodHeader}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xs,
              }}
            >
              <BaseIcon
                name="calendar-outline"
                size={16}
                color={colors.textSecondary}
              />
              <MText variant="bodyStrong" color="textPrimary">
                Last 30 days
              </MText>
            </View>
            <MText
              variant="bodyStrong"
              color="textPrimary"
              style={{ fontWeight: "900" }}
            >
              {monthTotal}
            </MText>
          </View>

          <MText
            variant="caption"
            color="textSecondary"
            style={{ marginTop: 2 }}
          >
            Total pages in last 30 days
          </MText>

          <View style={styles.periodTopHeader}>
            <MText variant="bodyStrong" color="textPrimary">
              Top 7 books
            </MText>
            <MText variant="caption" color="textSecondary">
              {monthSimple.length}
            </MText>
          </View>

          {monthSimple.length === 0 ? (
            <MText
              variant="caption"
              color="textSecondary"
              style={{ marginTop: spacing.sm }}
            >
              No reading found in the last 30 days.
            </MText>
          ) : (
            <FlatList
              data={monthSimple}
              keyExtractor={(x) => x.bookUri}
              renderItem={renderSimpleTopRow}
              scrollEnabled={false}
              contentContainerStyle={{ marginTop: spacing.sm }}
            />
          )}
        </Card>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  summaryCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  modeBreakdown: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  modeBreakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
  },

  sectionHeader: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },

  emptyCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },

  rowCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  totalPill: {
    minWidth: 36,
    height: 26,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  modesRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  modeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  periodCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  periodHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  periodTopHeader: {
    marginTop: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },

  simpleRowCard: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
    gap: 4,
  },
});
