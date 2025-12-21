// app/(tabs)/bookshelf/stats/stats-book.tsx
import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import dayjs from "dayjs";

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

import { useReadingStatsStore } from "@/store/bookshelf/useReadingStatsStore";
import { useReadingEventsStore } from "@/store/bookshelf/useReadingEventsStore";
import { formatBookNameFromUri } from "@/utils/formatBookName";
import { ReadingMode } from "@budget/core";
import { toNonNegativeInt } from "@/utils/toNonNegativeInt";
import { makeBookKey } from "@/utils/makeBookKey";

const DEFAULT_EVENTS_DISPLAY_LIMIT = 12;

const modeLabel: Record<ReadingMode, string> = {
  target: "Target",
  plan: "Plan",
  normal: "Normal",
};

const modeIcon: Record<ReadingMode, string> = {
  target: "locate-outline",
  plan: "calendar-outline",
  normal: "book-outline",
};

const formatModeParts = (pagesByMode: Record<ReadingMode, number>) => {
  const parts: Array<{
    mode: ReadingMode;
    value: number;
    icon: string;
    label: string;
  }> = [
    {
      mode: "target",
      value: toNonNegativeInt(pagesByMode?.target ?? 0),
      icon: "locate-outline",
      label: "Target",
    },
    {
      mode: "plan",
      value: toNonNegativeInt(pagesByMode?.plan ?? 0),
      icon: "calendar-outline",
      label: "Plan",
    },
    {
      mode: "normal",
      value: toNonNegativeInt(pagesByMode?.normal ?? 0),
      icon: "book-outline",
      label: "Normal",
    },
  ];
  return parts.filter((p) => p.value > 0);
};

type DayRow = {
  date: string; // YYYY-MM-DD
  pagesTotal: number;
  pagesByMode: Record<ReadingMode, number>;
};

type ReadingEvent = {
  date: string; // YYYY-MM-DD
  at: number; // ms timestamp
  mode: ReadingMode;
  bookUri: string;
  targetId?: string;
  pageFrom: number;
  pageTo: number;
  sectionId?: string;
  sectionTitle?: string;
};

// ---- range helpers ----
type Range = { a: number; b: number }; // a <= b

const normalizeRange = (from: number, to: number): Range => {
  const a = toNonNegativeInt(Math.min(from, to));
  const b = toNonNegativeInt(Math.max(from, to));
  return { a, b };
};

const rangeCount = (from: number, to: number) => {
  const r = normalizeRange(from, to);
  if (r.b < r.a) return 0;
  return r.b - r.a + 1;
};

const sumMergedRanges = (ranges: Range[]) => {
  if (!ranges.length) return 0;
  const sorted = [...ranges].sort((r1, r2) => r1.a - r2.a);

  let total = 0;
  let curA = sorted[0].a;
  let curB = sorted[0].b;

  for (let i = 1; i < sorted.length; i++) {
    const r = sorted[i];
    if (r.a <= curB + 1) {
      curB = Math.max(curB, r.b);
    } else {
      total += curB - curA + 1;
      curA = r.a;
      curB = r.b;
    }
  }
  total += curB - curA + 1;
  return Math.max(0, total);
};

const getSectionLabel = (e: ReadingEvent) => {
  const raw = (e.sectionTitle || e.sectionId || "").trim();
  return raw.length ? raw : "—";
};

const computeTopSection = (dayEvents: ReadingEvent[]) => {
  if (!dayEvents.length)
    return null as null | {
      label: string;
      pages: number;
      sectionsCount: number;
    };

  const groups: Record<string, Range[]> = {};
  for (const e of dayEvents) {
    const key = getSectionLabel(e);
    if (!groups[key]) groups[key] = [];
    groups[key].push(normalizeRange(e.pageFrom, e.pageTo));
  }

  const rows = Object.entries(groups)
    .map(([label, ranges]) => ({ label, pages: sumMergedRanges(ranges) }))
    .filter((r) => r.pages > 0);

  if (!rows.length) return null;
  rows.sort((a, b) => b.pages - a.pages);
  return {
    label: rows[0].label,
    pages: rows[0].pages,
    sectionsCount: rows.length,
  };
};

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

  const byBookDate = useReadingStatsStore((s) => s.byBookDate);
  const getBookWeekTotal = useReadingStatsStore((s) => s.getBookWeekTotal);
  const getBookMonthTotal = useReadingStatsStore((s) => s.getBookMonthTotal);

  const events = useReadingEventsStore((s) => s.events ?? []) as ReadingEvent[];

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
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <MText variant="body" color="textPrimary">
            Missing book uri
          </MText>
        </View>
      </AppScreen>
    );
  }

  const todayKey = makeBookKey(bookUri, today);
  const todayStat = byBookDate?.[todayKey];

  const todayTotal = toNonNegativeInt(todayStat?.pagesTotal ?? 0);
  const todayModeParts = useMemo(() => {
    return formatModeParts(
      (todayStat?.pagesByMode ?? { normal: 0, plan: 0, target: 0 }) as Record<
        ReadingMode,
        number
      >
    );
  }, [todayStat]);

  const weekTotal = useMemo(
    () => toNonNegativeInt(getBookWeekTotal(bookUri, today)),
    [getBookWeekTotal, bookUri, today]
  );
  const monthTotal = useMemo(
    () => toNonNegativeInt(getBookMonthTotal(bookUri, today)),
    [getBookMonthTotal, bookUri, today]
  );

  // Keep eventsByDate including today (needed for Today card details).
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

  // ---- Today (top card) ----
  const todayEventsAll = useMemo(
    () => eventsByDate[today] ?? [],
    [eventsByDate, today]
  );

  const todaySectionsTop = useMemo(() => {
    if (!todayEventsAll.length) return [];
    const groups: Record<string, Range[]> = {};
    for (const e of todayEventsAll) {
      const key = getSectionLabel(e);
      if (!groups[key]) groups[key] = [];
      groups[key].push(normalizeRange(e.pageFrom, e.pageTo));
    }
    const rows = Object.entries(groups)
      .map(([label, ranges]) => ({ label, pages: sumMergedRanges(ranges) }))
      .filter((r) => r.pages > 0);

    rows.sort((a, b) => b.pages - a.pages);
    return rows.slice(0, 4);
  }, [todayEventsAll]);

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
        }) as Record<ReadingMode, number>,
      });
    }
    return rows;
  }, [byBookDate, bookUri, today]);

  const [openDates, setOpenDates] = useState<Record<string, boolean>>({});
  const toggleDate = useCallback((date: string) => {
    setOpenDates((prev) => ({ ...prev, [date]: !prev[date] }));
  }, []);

  const [showAllDates, setShowAllDates] = useState<Record<string, boolean>>({});
  const toggleShowAll = useCallback((date: string) => {
    setShowAllDates((prev) => ({ ...prev, [date]: !prev[date] }));
  }, []);

  const [sectionFilterByDate, setSectionFilterByDate] = useState<
    Record<string, string | null>
  >({});

  const toggleSectionFilter = useCallback((date: string, label: string) => {
    setSectionFilterByDate((prev) => {
      const current = prev[date] ?? null;
      return { ...prev, [date]: current === label ? null : label };
    });
  }, []);

  const clearSectionFilter = useCallback((date: string) => {
    setSectionFilterByDate((prev) => ({ ...prev, [date]: null }));
  }, []);

  // -------- Today filtering ----------
  const selectedTodayLabel = sectionFilterByDate[today] ?? null;
  const todayEvents = selectedTodayLabel
    ? todayEventsAll.filter((e) => getSectionLabel(e) === selectedTodayLabel)
    : todayEventsAll;

  const isTodayOpen = !!openDates[today];
  const showAllToday = !!showAllDates[today];
  const todayShownEvents = showAllToday
    ? todayEvents
    : todayEvents.slice(0, DEFAULT_EVENTS_DISPLAY_LIMIT);

  const title = bookName ?? "Book stats";

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
        {/* Today */}
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

          {/* Today Sections breakdown */}
          {todaySectionsTop.length > 0 ? (
            <View style={{ marginTop: spacing.md }}>
              <View style={styles.subHeaderRow}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.xs,
                  }}
                >
                  <BaseIcon
                    name="albums-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <MText variant="bodyStrong" color="textPrimary">
                    Sections today
                  </MText>
                </View>
                <MText variant="caption" color="textSecondary">
                  top {todaySectionsTop.length}
                </MText>
              </View>

              <View style={styles.sectionPills}>
                {todaySectionsTop.map((s) => {
                  const isActive = selectedTodayLabel === s.label;
                  return (
                    <Pressable
                      key={s.label}
                      onPress={() => {
                        setOpenDates((prev) => ({ ...prev, [today]: true }));
                        toggleSectionFilter(today, s.label);
                      }}
                    >
                      <View
                        style={[
                          styles.sectionPill,
                          {
                            backgroundColor: colors.surfaceStrong,
                            borderColor: colors.borderSubtle,
                            opacity: isActive ? 1 : 0.92,
                          },
                        ]}
                      >
                        <MText
                          variant="caption"
                          color="textSecondary"
                          numberOfLines={1}
                          style={{ maxWidth: 160 }}
                        >
                          {s.label}
                        </MText>
                        <MText
                          variant="caption"
                          color="textPrimary"
                          style={{ fontWeight: "900" }}
                        >
                          {s.pages}p
                        </MText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {selectedTodayLabel ? (
                <View style={{ marginTop: spacing.xs }}>
                  <Pressable onPress={() => clearSectionFilter(today)}>
                    <View
                      style={[
                        styles.filteredPill,
                        {
                          backgroundColor: colors.surfaceStrong,
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                    >
                      <BaseIcon
                        name="funnel-outline"
                        size={12}
                        color={colors.textSecondary}
                      />
                      <MText
                        variant="caption"
                        color="textSecondary"
                        numberOfLines={1}
                        style={{ flex: 1 }}
                      >
                        Filtered: {selectedTodayLabel}
                      </MText>
                      <MText
                        variant="caption"
                        color="textPrimary"
                        style={{ fontWeight: "900" }}
                      >
                        {todayEvents.length} events
                      </MText>
                      <BaseIcon
                        name="close-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                    </View>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Today Details toggle */}
          {todayEventsAll.length > 0 ? (
            <Pressable
              onPress={() => toggleDate(today)}
              style={[
                styles.detailsToggle,
                { borderTopColor: colors.borderSubtle, marginTop: spacing.md },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xs,
                }}
              >
                <BaseIcon
                  name="list-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <MText variant="caption" color="textSecondary">
                  Today details
                </MText>
                <MText
                  variant="caption"
                  color="textSecondary"
                  style={{ opacity: 0.8 }}
                >
                  · {todayEventsAll.length}
                </MText>
                {selectedTodayLabel ? (
                  <MText
                    variant="caption"
                    color="textSecondary"
                    style={{ opacity: 0.8 }}
                  >
                    · filtered {todayEvents.length}
                  </MText>
                ) : null}
              </View>

              <BaseIcon
                name={isTodayOpen ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
          ) : null}

          {todayEventsAll.length > 0 && isTodayOpen ? (
            <View style={styles.detailsList}>
              <View style={styles.detailsMetaRow}>
                <MText variant="caption" color="textSecondary">
                  Showing {todayShownEvents.length} / {todayEvents.length}
                </MText>

                {todayEvents.length > DEFAULT_EVENTS_DISPLAY_LIMIT ? (
                  <Pressable onPress={() => toggleShowAll(today)}>
                    <View style={styles.showAllBtn}>
                      <BaseIcon
                        name={
                          showAllToday ? "contract-outline" : "expand-outline"
                        }
                        size={14}
                        color={colors.textSecondary}
                      />
                      <MText variant="caption" color="textSecondary">
                        {showAllToday ? "Show less" : "Show all"}
                      </MText>
                    </View>
                  </Pressable>
                ) : null}
              </View>

              {todayShownEvents.map((e, idx) => {
                const t = dayjs(e.at).format("HH:mm");
                const from = toNonNegativeInt(e.pageFrom);
                const to = toNonNegativeInt(e.pageTo);
                const delta = rangeCount(from, to);
                const section = getSectionLabel(e);

                return (
                  <View key={`${e.at}-${idx}`} style={styles.detailRow}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        flex: 1,
                      }}
                    >
                      <MText
                        variant="caption"
                        color="textSecondary"
                        style={{ width: 44 }}
                      >
                        {t}
                      </MText>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <BaseIcon
                          name={modeIcon[e.mode] as any}
                          size={12}
                          color={colors.textSecondary}
                        />
                        <MText variant="caption" color="textSecondary">
                          {modeLabel[e.mode]}
                        </MText>
                      </View>

                      <MText
                        variant="caption"
                        color="textPrimary"
                        style={{ fontWeight: "900" }}
                      >
                        p{Math.min(from, to)}–p{Math.max(from, to)}
                      </MText>

                      <MText variant="caption" color="textSecondary">
                        (+{delta})
                      </MText>
                    </View>

                    <MText
                      variant="caption"
                      color="textSecondary"
                      numberOfLines={1}
                      style={{ maxWidth: "55%" }}
                    >
                      {section}
                    </MText>
                  </View>
                );
              })}
            </View>
          ) : null}
        </Card>

        {/* Week / Month */}
        <View style={styles.grid2}>
          <Card
            style={[
              styles.kpiCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.kpiTop}>
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
              variant="heading3"
              color="textPrimary"
              style={{ fontWeight: "900", marginTop: spacing.xs }}
            >
              {weekTotal}
            </MText>
            <MText variant="caption" color="textSecondary">
              pages
            </MText>
          </Card>

          <Card
            style={[
              styles.kpiCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.kpiTop}>
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
              variant="heading3"
              color="textPrimary"
              style={{ fontWeight: "900", marginTop: spacing.xs }}
            >
              {monthTotal}
            </MText>
            <MText variant="caption" color="textSecondary">
              pages
            </MText>
          </Card>
        </View>

        {/* Last 30 days list (EXCLUDING today) */}
        <View style={styles.sectionHeader}>
          <MText variant="bodyStrong" color="textPrimary">
            Last 30 days · daily (excluding today)
          </MText>
          <MText variant="caption" color="textSecondary">
            {last30Days.length}
          </MText>
        </View>

        {last30Days.length === 0 ? (
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
              No reading found for this book in the last 30 days (excluding
              today).
            </MText>
          </Card>
        ) : (
          <FlatList
            data={last30Days}
            keyExtractor={(x) => x.date}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const parts = formatModeParts(item.pagesByMode);
              const dayEventsAll = eventsByDate[item.date] ?? [];
              const isOpen = !!openDates[item.date];
              const showAll = !!showAllDates[item.date];

              const topSection = computeTopSection(dayEventsAll);

              const selectedLabel = sectionFilterByDate[item.date] ?? null;
              const filterActive = !!selectedLabel;

              const dayEvents = selectedLabel
                ? dayEventsAll.filter(
                    (e) => getSectionLabel(e) === selectedLabel
                  )
                : dayEventsAll;

              const shownEvents = showAll
                ? dayEvents
                : dayEvents.slice(0, DEFAULT_EVENTS_DISPLAY_LIMIT);

              const onPressTopSection = () => {
                if (!topSection) return;
                setOpenDates((prev) => ({ ...prev, [item.date]: true }));
                toggleSectionFilter(item.date, topSection.label);
              };

              return (
                <Card
                  style={[
                    styles.dayRowCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <View style={styles.dayTop}>
                    <MText variant="bodyStrong" color="textPrimary">
                      {item.date}
                    </MText>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.sm,
                      }}
                    >
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

                  {!filterActive && topSection ? (
                    <Pressable
                      onPress={onPressTopSection}
                      style={{ marginTop: spacing.sm }}
                    >
                      <View
                        style={[
                          styles.topSectionPill,
                          {
                            backgroundColor: colors.surfaceStrong,
                            borderColor: colors.borderSubtle,
                          },
                        ]}
                      >
                        <BaseIcon
                          name="albums-outline"
                          size={12}
                          color={colors.textSecondary}
                        />
                        <MText
                          variant="caption"
                          color="textSecondary"
                          numberOfLines={1}
                          style={{ flex: 1 }}
                        >
                          {topSection.label}
                        </MText>
                        <MText
                          variant="caption"
                          color="textPrimary"
                          style={{ fontWeight: "900" }}
                        >
                          {topSection.pages}p
                        </MText>
                        {topSection.sectionsCount > 1 ? (
                          <MText
                            variant="caption"
                            color="textSecondary"
                            style={{ opacity: 0.75 }}
                          >
                            · {topSection.sectionsCount} sections
                          </MText>
                        ) : null}
                      </View>
                    </Pressable>
                  ) : null}

                  {filterActive ? (
                    <View style={{ marginTop: spacing.sm }}>
                      <Pressable onPress={() => clearSectionFilter(item.date)}>
                        <View
                          style={[
                            styles.filteredPill,
                            {
                              backgroundColor: colors.surfaceStrong,
                              borderColor: colors.borderSubtle,
                            },
                          ]}
                        >
                          <BaseIcon
                            name="funnel-outline"
                            size={12}
                            color={colors.textSecondary}
                          />
                          <MText
                            variant="caption"
                            color="textSecondary"
                            numberOfLines={1}
                            style={{ flex: 1 }}
                          >
                            Filtered: {selectedLabel}
                          </MText>
                          <MText
                            variant="caption"
                            color="textPrimary"
                            style={{ fontWeight: "900" }}
                          >
                            {dayEvents.length} events
                          </MText>
                          <BaseIcon
                            name="close-outline"
                            size={14}
                            color={colors.textSecondary}
                          />
                        </View>
                      </Pressable>
                    </View>
                  ) : null}

                  {dayEventsAll.length > 0 ? (
                    <Pressable
                      onPress={() => toggleDate(item.date)}
                      style={[
                        styles.detailsToggle,
                        { borderTopColor: colors.borderSubtle },
                      ]}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: spacing.xs,
                        }}
                      >
                        <BaseIcon
                          name="list-outline"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <MText variant="caption" color="textSecondary">
                          Details
                        </MText>
                        <MText
                          variant="caption"
                          color="textSecondary"
                          style={{ opacity: 0.8 }}
                        >
                          · {dayEventsAll.length}
                        </MText>
                        {filterActive ? (
                          <MText
                            variant="caption"
                            color="textSecondary"
                            style={{ opacity: 0.8 }}
                          >
                            · filtered {dayEvents.length}
                          </MText>
                        ) : null}
                      </View>

                      <BaseIcon
                        name={isOpen ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  ) : null}

                  {dayEventsAll.length > 0 && isOpen ? (
                    <View style={styles.detailsList}>
                      <View style={styles.detailsMetaRow}>
                        <MText variant="caption" color="textSecondary">
                          Showing {shownEvents.length} / {dayEvents.length}
                        </MText>

                        {dayEvents.length > DEFAULT_EVENTS_DISPLAY_LIMIT ? (
                          <Pressable onPress={() => toggleShowAll(item.date)}>
                            <View style={styles.showAllBtn}>
                              <BaseIcon
                                name={
                                  showAll
                                    ? "contract-outline"
                                    : "expand-outline"
                                }
                                size={14}
                                color={colors.textSecondary}
                              />
                              <MText variant="caption" color="textSecondary">
                                {showAll ? "Show less" : "Show all"}
                              </MText>
                            </View>
                          </Pressable>
                        ) : null}
                      </View>

                      {shownEvents.map((e, idx) => {
                        const t = dayjs(e.at).format("HH:mm");
                        const from = e.pageFrom;
                        const to = toNonNegativeInt(e.pageTo);
                        const delta = rangeCount(from, to);
                        const section = getSectionLabel(e);

                        return (
                          <View key={`${e.at}-${idx}`} style={styles.detailRow}>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                                flex: 1,
                              }}
                            >
                              <MText
                                variant="caption"
                                color="textSecondary"
                                style={{ width: 44 }}
                              >
                                {t}
                              </MText>

                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <BaseIcon
                                  name={modeIcon[e.mode] as any}
                                  size={12}
                                  color={colors.textSecondary}
                                />
                                <MText variant="caption" color="textSecondary">
                                  {modeLabel[e.mode]}
                                </MText>
                              </View>

                              <MText
                                variant="caption"
                                color="textPrimary"
                                style={{ fontWeight: "900" }}
                              >
                                p{Math.min(from, to)}–p{Math.max(from, to)}
                              </MText>

                              <MText variant="caption" color="textSecondary">
                                (+{delta})
                              </MText>
                            </View>

                            <MText
                              variant="caption"
                              color="textSecondary"
                              numberOfLines={1}
                              style={{ maxWidth: "55%" }}
                            >
                              {section}
                            </MText>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </Card>
              );
            }}
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
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
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

  subHeaderRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
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

  sectionPills: {
    marginTop: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  sectionPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    maxWidth: 240,
  },

  grid2: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  kpiCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  kpiTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
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

  dayRowCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  dayTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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

  topSectionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    maxWidth: "100%",
  },

  filteredPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    maxWidth: "100%",
  },

  detailsToggle: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailsList: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },

  detailsMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: 2,
  },
  showAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: 4,
  },
});
