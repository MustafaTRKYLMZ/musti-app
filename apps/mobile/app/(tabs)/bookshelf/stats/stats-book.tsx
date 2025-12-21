import React, { useMemo, useState, useCallback } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import dayjs from "dayjs";

import { AppScreen } from "@/components/AppScreen";
import { IconButton } from "@/components/ui/AppIcon";
import { spacing, iconSizes, useTheme } from "@budget/ui-native";

import { useReadingStatsStore } from "@/store/bookshelf/useReadingStatsStore";
import { useReadingEventsStore } from "@/store/bookshelf/useReadingEventsStore";
import { formatBookNameFromUri } from "@/utils/formatBookName";
import { toNonNegativeInt } from "@/utils/toNonNegativeInt";
import { makeBookKey } from "@/utils/makeBookKey";

import type {
  DayRow,
  PageRange,
  ReadingEvent,
  ReadingMode,
} from "@budget/core";

import { TodayCard } from "@/components/Books/statsBook/TodayCard";
import { StatsKpiRow } from "@/components/Books/statsBook/StatsKpiRow";
import { Last30DaysHeader } from "@/components/Books/statsBook/Last30DaysHeader";
import { Last30DaysList } from "@/components/Books/statsBook/Last30DaysList";
import { EmptyStateCard } from "@/components/Books/statsBook/EmptyStateCard";
import { formatModeParts } from "@/utils/formatModeParts";
import {
  getSectionLabel,
  normalizeRange,
  sumMergedRanges,
} from "@/utils/statsBookUtils";

const DEFAULT_EVENTS_DISPLAY_LIMIT = 12;

export default function StatsBookScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const params = useLocalSearchParams<{ uri?: string; name?: string }>();

  const bookUri = useMemo(() => {
    if (!params?.uri) return undefined;
    try {
      return decodeURIComponent(String(params.uri));
    } catch {
      return String(params.uri);
    }
  }, [params?.uri]);

  const bookName = useMemo(() => {
    if (params?.name) {
      try {
        return decodeURIComponent(String(params.name));
      } catch {
        return String(params.name);
      }
    }
    if (bookUri) return formatBookNameFromUri(bookUri);
    return "Book";
  }, [params?.name, bookUri]);

  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);
  const title = bookName ?? "Book stats";

  const byBookDate = useReadingStatsStore((s) => s.byBookDate);
  const getBookWeekTotal = useReadingStatsStore((s) => s.getBookWeekTotal);
  const getBookMonthTotal = useReadingStatsStore((s) => s.getBookMonthTotal);

  const events = useReadingEventsStore((s) => s.events ?? []) as ReadingEvent[];

  // ------- guards -------
  if (!bookUri) {
    return (
      <AppScreen
        title="Book stats"
        headerLeft={
          <IconButton
            name="chevron-back"
            size={iconSizes.lg}
            color={colors.textPrimary}
            onPress={() => router.back()}
          />
        }
      >
        <View style={[styles.center, { backgroundColor: colors.background }]} />
      </AppScreen>
    );
  }

  // ------- stats -------
  const todayKey = makeBookKey(bookUri, today);
  const todayStat = byBookDate?.[todayKey];
  const todayTotal = toNonNegativeInt(todayStat?.pagesTotal ?? 0);

  const weekTotal = useMemo(
    () => toNonNegativeInt(getBookWeekTotal(bookUri, today)),
    [getBookWeekTotal, bookUri, today]
  );

  const monthTotal = useMemo(
    () => toNonNegativeInt(getBookMonthTotal(bookUri, today)),
    [getBookMonthTotal, bookUri, today]
  );

  // Keep eventsByDate including today (TodayCard needs it)
  const eventsByDate = useMemo(() => {
    const from = dayjs(today).subtract(29, "day").format("YYYY-MM-DD");
    const map: Record<string, ReadingEvent[]> = {};

    for (const e of events) {
      if (!e) continue;
      if (e.bookUri !== bookUri) continue;
      if (!e.date) continue;
      if (e.date < from || e.date > today) continue;

      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }

    for (const d of Object.keys(map)) {
      map[d].sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
    }

    return map;
  }, [events, bookUri, today]);

  // ✅ Last 30 days list: EXCLUDE TODAY (yesterday -> 30 days ago)
  const last30Days: DayRow[] = useMemo(() => {
    const rows: DayRow[] = [];
    for (let i = 1; i <= 30; i++) {
      const d = dayjs(today).subtract(i, "day").format("YYYY-MM-DD");
      const k = makeBookKey(bookUri, d);
      const s = byBookDate?.[k];
      const pagesTotal = toNonNegativeInt(s?.pagesTotal ?? 0);
      if (pagesTotal <= 0) continue;

      rows.push({
        date: d,
        pagesTotal,
        pagesByMode: (s?.pagesByMode ?? {
          normal: 0,
          plan: 0,
          target: 0,
        }) as any,
      });
    }
    return rows;
  }, [byBookDate, bookUri, today]);

  const [openDates, setOpenDates] = useState<Record<string, boolean>>({});
  const [showAllDates, setShowAllDates] = useState<Record<string, boolean>>({});
  const [sectionFilterByDate, setSectionFilterByDate] = useState<
    Record<string, string | null>
  >({});

  const toggleDate = useCallback((date: string) => {
    setOpenDates((prev) => ({ ...prev, [date]: !prev[date] }));
  }, []);

  const openDate = useCallback((date: string) => {
    setOpenDates((prev) => ({ ...prev, [date]: true }));
  }, []);

  const toggleShowAll = useCallback((date: string) => {
    setShowAllDates((prev) => ({ ...prev, [date]: !prev[date] }));
  }, []);

  const toggleSectionFilter = useCallback((date: string, label: string) => {
    setSectionFilterByDate((prev) => {
      const current = prev[date] ?? null;
      return { ...prev, [date]: current === label ? null : label };
    });
  }, []);

  const clearSectionFilter = useCallback((date: string) => {
    setSectionFilterByDate((prev) => ({ ...prev, [date]: null }));
  }, []);

  // ---- Today derived state (StatsBookScreen içinde) ----
  const todayEventsAll = useMemo(
    () => eventsByDate[today] ?? [],
    [eventsByDate, today]
  );

  const selectedTodayLabel = sectionFilterByDate[today] ?? null;

  const todayEventsFiltered = useMemo(() => {
    if (!selectedTodayLabel) return todayEventsAll;
    return todayEventsAll.filter(
      (e) => getSectionLabel(e) === selectedTodayLabel
    );
  }, [todayEventsAll, selectedTodayLabel]);

  const isTodayOpen = !!openDates[today];
  const showAllToday = !!showAllDates[today];

  const todayEventsShown = useMemo(() => {
    if (showAllToday) return todayEventsFiltered;
    return todayEventsFiltered.slice(0, DEFAULT_EVENTS_DISPLAY_LIMIT);
  }, [todayEventsFiltered, showAllToday]);

  const todaySectionsTop = useMemo(() => {
    if (!todayEventsAll.length) return [];
    const groups: Record<string, PageRange[]> = {};
    for (const e of todayEventsAll) {
      const key = getSectionLabel(e);
      if (!groups[key]) groups[key] = [];
      groups[key].push(normalizeRange(e.pageFrom, e.pageTo));
    }

    const rows = Object.entries(groups)
      .map(([label, ranges]) => ({ label, pages: sumMergedRanges(ranges) }))
      .filter((r) => r.pages > 0)
      .sort((a, b) => b.pages - a.pages)
      .slice(0, 4);

    return rows;
  }, [todayEventsAll]);

  const todayModeParts = useMemo(() => {
    return formatModeParts(
      (todayStat?.pagesByMode ?? { normal: 0, plan: 0, target: 0 }) as Record<
        ReadingMode,
        number
      >
    );
  }, [todayStat]);

  return (
    <AppScreen
      title={title}
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
        {/* ✅ extracted: Today */}
        <TodayCard
          today={today}
          todayTotal={todayTotal}
          modeParts={todayModeParts}
          sectionsTop={todaySectionsTop}
          selectedSectionLabel={selectedTodayLabel}
          eventsAllCount={todayEventsAll.length}
          eventsFilteredCount={todayEventsFiltered.length}
          shownEventsCount={todayEventsShown.length}
          eventsShown={todayEventsShown}
          isOpen={isTodayOpen}
          showAll={showAllToday}
          onToggleOpen={() => toggleDate(today)}
          onToggleShowAll={() => toggleShowAll(today)}
          onSelectSection={(label) => {
            openDate(today);
            toggleSectionFilter(today, label);
          }}
          onClearSectionFilter={() => clearSectionFilter(today)}
          eventsDisplayLimit={DEFAULT_EVENTS_DISPLAY_LIMIT}
        />

        {/* ✅ extracted: KPI row */}
        <StatsKpiRow weekTotal={weekTotal} monthTotal={monthTotal} />

        {/* ✅ extracted: Header */}
        <Last30DaysHeader count={last30Days.length} />

        {/* ✅ extracted: Empty/List */}
        {last30Days.length === 0 ? (
          <EmptyStateCard message="No reading found for this book in the last 30 days (excluding today)." />
        ) : (
          <Last30DaysList
            rows={last30Days}
            eventsByDate={eventsByDate}
            openDates={openDates}
            showAllDates={showAllDates}
            sectionFilterByDate={sectionFilterByDate}
            defaultEventsDisplayLimit={DEFAULT_EVENTS_DISPLAY_LIMIT}
            toggleDate={toggleDate}
            toggleShowAll={toggleShowAll}
            toggleSectionFilter={toggleSectionFilter}
            clearSectionFilter={clearSectionFilter}
            openDate={openDate}
          />
        )}
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
  center: {
    flex: 1,
  },
});
