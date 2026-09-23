import React, { useMemo } from "react";
import { StyleSheet, View, FlatList } from "react-native";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  spacing,
  MText,
  Card,
  radii,
  BaseIcon,
  useTheme,
} from "@musti/ui-native";
import { BookshelfSubScreen } from "@/components/Books/BookshelfSubScreen";

import { useReadingStatsStore } from "@/store/bookshelf/useReadingStatsStore";
import { useReadingEventsStore } from "@/store/bookshelf/useReadingEventsStore";
import { toNonNegativeInt } from "@/utils/toNonNegativeInt";
import { addDays } from "@/utils/calendar/addISODateDays";

import { TodaySummaryCard } from "@/components/Books/statsBook/TodaySummaryCard";
import { PeriodCard } from "@/components/Books/statsBook/PeriodCard";

import { ReadingMode, useTranslation, formatTranslation } from "@musti/core";
import { formatModeParts } from "@/utils/formatModeParts";
import { guessNameFromUri } from "@/utils/guessNameFromUri";
import { useLocalBooks } from "@/hooks/useLocalBooks";

type DayRow = {
  date: string;
  pages: number;
  minutes: number;
};

const msToMinutes = (ms: number) => Math.round(Math.max(0, ms) / 60000);

const sumMinutesForBookOnDate = (
  events: any[] | undefined,
  bookUri: string,
  date: string
) => {
  if (!events?.length || !bookUri || !date) return 0;
  let totalMs = 0;

  for (const e of events) {
    if (!e) continue;
    if (e.date !== date) continue;
    if (e.bookUri !== bookUri) continue;

    const ms =
      typeof e.durationMs === "number" && Number.isFinite(e.durationMs)
        ? Math.max(0, e.durationMs)
        : 0;

    totalMs += ms;
  }

  return msToMinutes(totalMs);
};

export default function StatsBookScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();

  const uri = useMemo(() => {
    const raw = typeof params?.uri === "string" ? params.uri : "";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [params?.uri]);

  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);

  const { books } = useLocalBooks();
  const bookName = useMemo(() => {
    const local = books.find((b) => b.uri === uri)?.name;
    return local ?? guessNameFromUri(uri);
  }, [books, uri]);

  const getForBookDate = useReadingStatsStore((s) => s.getForBookDate);
  const getBookWeekTotal = useReadingStatsStore((s) => s.getBookWeekTotal);
  const getBookMonthTotal = useReadingStatsStore((s) => s.getBookMonthTotal);

  const getBookRange = useReadingStatsStore((s) => s.getBookRange);
  const getBookBestDay = useReadingStatsStore((s) => s.getBookBestDay);
  const getBookStreak = useReadingStatsStore((s) => s.getBookStreak);

  const events = useReadingEventsStore((s) => s.events);

  const weekFrom = useMemo(() => addDays(today, -6), [today]);
  const monthFrom = useMemo(() => addDays(today, -29), [today]);

  // Today book stat (pages)
  const todayBook = useMemo(() => {
    if (!uri) return undefined;
    return getForBookDate(uri, today);
  }, [uri, today, getForBookDate]);

  const todayPages = toNonNegativeInt(todayBook?.pagesTotal ?? 0);

  const todayModeParts = useMemo(() => {
    return formatModeParts(
      (todayBook?.pagesByMode ?? { normal: 0, plan: 0, target: 0 }) as Record<
        ReadingMode,
        number
      >
    );
  }, [todayBook]);

  const todayMinutes = useMemo(() => {
    if (!uri) return 0;
    return sumMinutesForBookOnDate(events as any[], uri, today);
  }, [events, today, uri]);

  // Totals
  const weekTotalPages = useMemo(() => {
    if (!uri) return 0;
    return toNonNegativeInt(getBookWeekTotal(uri, today));
  }, [uri, today, getBookWeekTotal]);

  const monthTotalPages = useMemo(() => {
    if (!uri) return 0;
    return toNonNegativeInt(getBookMonthTotal(uri, today));
  }, [uri, today, getBookMonthTotal]);

  const weekRows: DayRow[] = useMemo(() => {
    if (!uri) return [];
    const stats = getBookRange(uri, weekFrom, today) ?? [];

    const byDate: Record<string, number> = {};
    for (const s of stats) {
      if (!s?.date) continue;
      byDate[s.date] = toNonNegativeInt(s.pagesTotal ?? 0);
    }

    const rows: DayRow[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(today, -i);
      const pages = byDate[d] ?? 0;
      const minutes = sumMinutesForBookOnDate(events as any[], uri, d);
      rows.push({ date: d, pages, minutes });
    }

    return rows;
  }, [uri, weekFrom, today, getBookRange, events]);

  const weekTotalMinutes = useMemo(() => {
    let sum = 0;
    for (const r of weekRows) sum += r.minutes;
    return sum;
  }, [weekRows]);

  const monthRows: DayRow[] = useMemo(() => {
    if (!uri) return [];
    const stats = getBookRange(uri, monthFrom, today) ?? [];

    const rows: DayRow[] = [];
    for (const s of stats) {
      const d = s.date;
      if (!d) continue;
      const pages = toNonNegativeInt(s.pagesTotal ?? 0);
      const minutes = sumMinutesForBookOnDate(events as any[], uri, d);
      rows.push({ date: d, pages, minutes });
    }

    // stats only includes days with pages; fine for "top days"
    rows.sort((a, b) => b.pages - a.pages);
    return rows;
  }, [uri, monthFrom, today, getBookRange, events]);

  const monthTotalMinutes = useMemo(() => {
    let sum = 0;
    for (const r of monthRows) sum += r.minutes;
    return sum;
  }, [monthRows]);

  // best day + streak
  const bestDay = useMemo(() => {
    if (!uri) return undefined;
    return getBookBestDay(uri);
  }, [uri, getBookBestDay]);

  const streak = useMemo(() => {
    if (!uri) return 0;
    return getBookStreak(uri, today);
  }, [uri, today, getBookStreak]);

  const renderDayRow = ({ item }: { item: DayRow }) => (
    <View
      style={[
        styles.dayRow,
        { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
      ]}
    >
      <MText variant="bodyStrong" color="textPrimary" style={{ width: 92 }}>
        {item.date}
      </MText>

      <View
        style={{
          flex: 1,
          flexDirection: "row",
          justifyContent: "flex-end",
          gap: spacing.md,
        }}
      >
        <View style={styles.kv}>
          <BaseIcon
            name="book-outline"
            color={colors.textSecondary}
          />
          <MText variant="caption" color="textSecondary">
            {formatTranslation(t("bookshelf.stats.pagesShort"), {
              count: item.pages,
            })}
          </MText>
        </View>

        <View style={styles.kv}>
          <BaseIcon
            name="time-outline"
            color={colors.textSecondary}
          />
          <MText variant="caption" color="textSecondary">
            {formatTranslation(t("bookshelf.common.minCount"), {
              count: item.minutes,
            })}
          </MText>
        </View>
      </View>
    </View>
  );

  return (
    <BookshelfSubScreen title={bookName}>
      <View style={styles.statsContent}>
        <TodaySummaryCard
          today={today}
          todayTotal={todayPages}
          modeParts={todayModeParts}
          todayMinutes={todayMinutes}
        />

        {/* ✅ Small highlights */}
        <Card
          style={[
            styles.highlights,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <View style={styles.highlightItem}>
            <BaseIcon
              name="flame-outline"
              color={colors.textSecondary}
            />
            <MText variant="body" color="textSecondary">
              {t("bookshelf.streak.title")}
            </MText>
            <MText
              variant="bodyStrong"
              color="textPrimary"
              style={{ marginLeft: "auto" }}
            >
              {streak}{" "}
              {streak === 1
                ? t("bookshelf.streak.day")
                : t("bookshelf.streak.days")}
            </MText>
          </View>

          <View style={styles.highlightItem}>
            <BaseIcon
              name="trophy-outline"
              color={colors.textSecondary}
            />
            <MText variant="body" color="textSecondary">
              {t("bookshelf.stats.bestDay")}
            </MText>
            <MText
              variant="bodyStrong"
              color="textPrimary"
              style={{ marginLeft: "auto" }}
            >
              {bestDay
                ? formatTranslation(t("bookshelf.stats.bestDayDetail"), {
                    pages: bestDay.pages,
                    date: bestDay.date,
                  })
                : "—"}
            </MText>
          </View>
        </Card>

        <PeriodCard
          icon="time-outline"
          title={t("bookshelf.stats.last7Days")}
          total={weekTotalPages}
          subtitle={formatTranslation(t("bookshelf.stats.pagesInRange"), {
            from: weekFrom,
            to: today,
            minutes: weekTotalMinutes,
          })}
          topTitle={t("bookshelf.stats.dailyBreakdown")}
          topCount={weekRows.length}
        >
          <FlatList
            data={weekRows}
            keyExtractor={(x) => x.date}
            renderItem={renderDayRow}
            scrollEnabled={false}
            contentContainerStyle={{ marginTop: spacing.sm, gap: spacing.xs }}
          />
        </PeriodCard>

        <PeriodCard
          icon="calendar-outline"
          title={t("bookshelf.stats.last30Days")}
          total={monthTotalPages}
          subtitle={formatTranslation(t("bookshelf.stats.pagesInRange"), {
            from: monthFrom,
            to: today,
            minutes: monthTotalMinutes,
          })}
          topTitle={t("bookshelf.stats.topDays")}
          topCount={Math.min(10, monthRows.length)}
        >
          {monthRows.length === 0 ? (
            <MText
              variant="caption"
              color="textSecondary"
              style={{ marginTop: spacing.sm }}
            >
              {t("bookshelf.stats.noReading30")}
            </MText>
          ) : (
            <FlatList
              data={monthRows.slice(0, 10)}
              keyExtractor={(x) => x.date}
              renderItem={renderDayRow}
              scrollEnabled={false}
              contentContainerStyle={{ marginTop: spacing.sm, gap: spacing.xs }}
            />
          )}
        </PeriodCard>

      </View>
    </BookshelfSubScreen>
  );
}

const styles = StyleSheet.create({
  statsContent: {
    gap: spacing.md,
  },

  highlights: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  highlightItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  dayRow: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  kv: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
