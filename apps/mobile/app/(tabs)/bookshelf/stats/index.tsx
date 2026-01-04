import React, { useMemo, useCallback } from "react";
import { ScrollView, StyleSheet, FlatList, View } from "react-native";
import dayjs from "dayjs";
import { useRouter } from "expo-router";

import { AppScreen } from "@/components/AppScreen";
import { IconButton } from "@/components/ui/AppIcon";
import { spacing, iconSizes, useTheme, MText } from "@musti/ui-native";

import { useReadingStatsStore } from "@/store/bookshelf/useReadingStatsStore";
import { useReadingEventsStore } from "@/store/bookshelf/useReadingEventsStore";

import { toNonNegativeInt } from "@/utils/toNonNegativeInt";
import { formatModeParts } from "@/utils/formatModeParts";
import { guessNameFromUri } from "@/utils/guessNameFromUri";
import { ReadingMode } from "@musti/core";

import { BookRowCard } from "@/components/Books/statsBook/BookRowCard";
import { EmptyStateCard } from "@/components/Books/statsBook/EmptyStateCard";
import { PeriodCard } from "@/components/Books/statsBook/PeriodCard";
import { SimpleTopRowCard } from "@/components/Books/statsBook/SimpleTopRowCard";
import { TodaySummaryCard } from "@/components/Books/statsBook/TodaySummaryCard";
import { BookRow, SimpleTopRow } from "@/components/Books/statsBook/types";
import { useLocalBooks } from "@/hooks/useLocalBooks";
import { StatsSectionHeader } from "@/components/Books/statsBook/StatsSectionHeader";

export default function StatsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);

  // store
  const byDate = useReadingStatsStore((s) => s.byDate);
  const byBookDate = useReadingStatsStore((s) => s.byBookDate);

  const getWeekTotal = useReadingStatsStore((s) => s.getWeekTotal);
  const getMonthTotal = useReadingStatsStore((s) => s.getMonthTotal);
  const getBookWeekTotal = useReadingStatsStore((s) => s.getBookWeekTotal);
  const getBookMonthTotal = useReadingStatsStore((s) => s.getBookMonthTotal);

  // ✅ events (minutes comes from durationMs)
  const events = useReadingEventsStore((s) => s.events);

  // local pdfs
  const { books } = useLocalBooks();

  const bookNameByUri = useMemo(() => {
    const map: Record<string, string> = {};
    for (const b of books) map[b.uri] = b.name;
    return map;
  }, [books]);

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

  // Today global
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

  // ✅ NEW: today minutes (global)
  const todayMinutes = useMemo(() => {
    let totalMs = 0;

    for (const e of events ?? []) {
      if (!e) continue;
      if (e.date !== today) continue;

      const ms =
        typeof (e as any).durationMs === "number" &&
        Number.isFinite((e as any).durationMs)
          ? Math.max(0, (e as any).durationMs)
          : 0;

      totalMs += ms;
    }

    return Math.round(totalMs / 60000);
  }, [events, today]);

  // Today top books (7)
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
    rows.sort((a, b) => b.pagesTotal - a.pagesTotal);
    return rows.slice(0, 7);
  }, [byBookDate, today, bookNameByUri]);

  // Week / month totals
  const weekTotal = useMemo(
    () => toNonNegativeInt(getWeekTotal(today)),
    [getWeekTotal, today]
  );
  const monthTotal = useMemo(
    () => toNonNegativeInt(getMonthTotal(today)),
    [getMonthTotal, today]
  );

  // Top 7 for week/month (simple rows)
  const weekTop7: SimpleTopRow[] = useMemo(() => {
    const rows: SimpleTopRow[] = [];
    for (const b of books) {
      const pages = toNonNegativeInt(getBookWeekTotal(b.uri, today));
      if (pages <= 0) continue;
      rows.push({ bookUri: b.uri, bookName: b.name, pages });
    }
    rows.sort((a, b) => b.pages - a.pages);
    return rows.slice(0, 7);
  }, [books, getBookWeekTotal, today]);

  const monthTop7: SimpleTopRow[] = useMemo(() => {
    const rows: SimpleTopRow[] = [];
    for (const b of books) {
      const pages = toNonNegativeInt(getBookMonthTotal(b.uri, today));
      if (pages <= 0) continue;
      rows.push({ bookUri: b.uri, bookName: b.name, pages });
    }
    rows.sort((a, b) => b.pages - a.pages);
    return rows.slice(0, 7);
  }, [books, getBookMonthTotal, today]);

  const renderBookRow = useCallback(
    ({ item }: { item: BookRow }) => (
      <BookRowCard item={item} onPress={() => openBookStats(item.bookUri)} />
    ),
    [openBookStats]
  );

  const renderSimpleTopRow = useCallback(
    ({ item }: { item: SimpleTopRow }) => (
      <SimpleTopRowCard
        item={item}
        onPress={() => openBookStats(item.bookUri)}
      />
    ),
    [openBookStats]
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
        <TodaySummaryCard
          today={today}
          todayTotal={todayTotal}
          modeParts={todayModeParts}
          todayMinutes={todayMinutes} // ✅ NEW
        />

        <StatsSectionHeader
          title="Today · Top 7 books"
          count={todayBooksTop7.length}
        />

        {todayBooksTop7.length === 0 ? (
          <EmptyStateCard message="No reading logged for today." />
        ) : (
          <FlatList
            data={todayBooksTop7}
            keyExtractor={(x) => x.bookUri}
            renderItem={renderBookRow}
            scrollEnabled={false}
          />
        )}

        <PeriodCard
          icon="time-outline"
          title="Last 7 days"
          total={weekTotal}
          subtitle="Total pages in last 7 days"
          topTitle="Top 7 books"
          topCount={weekTop7.length}
        >
          {weekTop7.length === 0 ? (
            <MText
              variant="caption"
              color="textSecondary"
              style={{ marginTop: spacing.sm }}
            >
              No reading found in the last 7 days.
            </MText>
          ) : (
            <FlatList
              data={weekTop7}
              keyExtractor={(x) => x.bookUri}
              renderItem={renderSimpleTopRow}
              scrollEnabled={false}
              contentContainerStyle={{ marginTop: spacing.sm }}
            />
          )}
        </PeriodCard>

        <PeriodCard
          icon="calendar-outline"
          title="Last 30 days"
          total={monthTotal}
          subtitle="Total pages in last 30 days"
          topTitle="Top 7 books"
          topCount={monthTop7.length}
        >
          {monthTop7.length === 0 ? (
            <MText
              variant="caption"
              color="textSecondary"
              style={{ marginTop: spacing.sm }}
            >
              No reading found in the last 30 days.
            </MText>
          ) : (
            <FlatList
              data={monthTop7}
              keyExtractor={(x) => x.bookUri}
              renderItem={renderSimpleTopRow}
              scrollEnabled={false}
              contentContainerStyle={{ marginTop: spacing.sm }}
            />
          )}
        </PeriodCard>

        <View style={{ height: spacing.lg }} />
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
});
