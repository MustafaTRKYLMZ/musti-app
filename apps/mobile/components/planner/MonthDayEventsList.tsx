import React, { FC, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
  RefreshControl,
} from "react-native";

import { useTranslation } from "@musti/core";
import { MText, plannerTheme } from "@musti/ui-native";
import {
  eventToStartDate,
  formatTime24,
  sameDay,
  startOfDay,
  MEvent,
} from "@musti/planner";
import { useCalendar } from "@/hooks/useCalendar";
import { eventToTitle } from "@/utils/calendar/format";
import {
  buildDayEventIndex,
  getDayEventMarkers,
} from "@/utils/calendar/dayEventIndex";

const { colors, spacing } = plannerTheme;

const TIME_COL_W = 44;
const DOT = 10;

function getEventStart(ev: MEvent): Date | null {
  const sd = eventToStartDate(ev as any);
  if (sd) return sd;

  const raw = (ev as any)?.start;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function getEventEnd(ev: MEvent, start: Date): Date {
  const rawEnd = (ev as any)?.end;
  if (rawEnd) {
    const d = new Date(rawEnd);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date(start.getTime() + 60 * 1000);
}

function isAllDayEvent(ev: MEvent, start: Date, end: Date): boolean {
  if ((ev as any)?.allDay) return true;
  const durationMs = end.getTime() - start.getTime();
  return durationMs >= 23 * 60 * 60 * 1000;
}

type AgendaMeta = {
  timeLabel: string;
  range: string;
  sortKey: number;
  groupKey: string;
};

function buildAgendaMeta(
  ev: MEvent,
  day: Date,
  allDayLabel: string,
  ongoingLabel: string
): AgendaMeta {
  const start = getEventStart(ev);
  if (!start) {
    return { timeLabel: "", range: "", sortKey: 99999, groupKey: "unknown" };
  }

  const end = getEventEnd(ev, start);

  if (isAllDayEvent(ev, start, end)) {
    return {
      timeLabel: allDayLabel,
      range: allDayLabel,
      sortKey: -1,
      groupKey: "allday",
    };
  }

  const isMultiDay =
    startOfDay(start).getTime() !== startOfDay(end).getTime();

  if (isMultiDay) {
    if (sameDay(start, day)) {
      const startStr = formatTime24(start);
      const endStr = formatTime24(end);
      const minutes = start.getHours() * 60 + start.getMinutes();
      return {
        timeLabel: startStr,
        range: `${startStr} – ${endStr}`,
        sortKey: minutes,
        groupKey: `t-${minutes}`,
      };
    }
    if (sameDay(end, day)) {
      const endStr = formatTime24(end);
      const dayStart = startOfDay(end);
      const minutes = dayStart.getHours() * 60 + dayStart.getMinutes();
      return {
        timeLabel: endStr,
        range: `${formatTime24(dayStart)} – ${endStr}`,
        sortKey: minutes,
        groupKey: `t-${minutes}`,
      };
    }
    return {
      timeLabel: "00:00",
      range: ongoingLabel,
      sortKey: 0,
      groupKey: "ongoing",
    };
  }

  const startStr = formatTime24(start);
  const endStr = formatTime24(end);
  const minutes = start.getHours() * 60 + start.getMinutes();
  return {
    timeLabel: startStr,
    range: `${startStr} – ${endStr}`,
    sortKey: minutes,
    groupKey: `t-${minutes}`,
  };
}

type AgendaEventItem = {
  ev: MEvent;
  title: string;
  color: string;
  range: string;
};

type TimeGroup = {
  groupKey: string;
  timeLabel: string;
  sortKey: number;
  items: AgendaEventItem[];
};

export type MonthDayEventsListProps = {
  date: Date;
  events: MEvent[];
  onTop?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
};

export const MonthDayEventsList: FC<MonthDayEventsListProps> = ({
  date,
  events,
  onTop,
  onRefresh,
  refreshing,
}) => {
  const { pressEvent } = useCalendar();
  const { t } = useTranslation();

  const dayIndex = useMemo(() => buildDayEventIndex(events), [events]);

  const timeGroups = useMemo(() => {
    const markers = getDayEventMarkers(dayIndex, date);
    const byId = new Map(events.map((ev) => [ev.id, ev]));
    const dayEvents = markers
      .map((m) => byId.get(m.id))
      .filter((ev): ev is MEvent => Boolean(ev));

    const allDayLabel = t("planner.form.allDay");
    const ongoingLabel = t("planner.agenda.ongoing");

    const groupMap = new Map<string, TimeGroup>();

    for (const ev of dayEvents) {
      const meta = buildAgendaMeta(ev, date, allDayLabel, ongoingLabel);
      const item: AgendaEventItem = {
        ev,
        title: eventToTitle(ev as any),
        color: (ev as any)?.color ?? colors.primary,
        range: meta.range,
      };

      const existing = groupMap.get(meta.groupKey);
      if (existing) {
        existing.items.push(item);
      } else {
        groupMap.set(meta.groupKey, {
          groupKey: meta.groupKey,
          timeLabel: meta.timeLabel,
          sortKey: meta.sortKey,
          items: [item],
        });
      }
    }

    return [...groupMap.values()].sort((a, b) => a.sortKey - b.sortKey);
  }, [dayIndex, date, events, t]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!onTop) return;
    if (e.nativeEvent.contentOffset.y <= 0) onTop();
  };

  if (!timeGroups.length) {
    return (
      <View style={styles.empty}>
        <MText style={styles.emptyText}>{t("planner.agenda.noEvents")}</MText>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      scrollEventThrottle={16}
      onScroll={handleScroll}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
          />
        ) : undefined
      }
    >
      {timeGroups.map((group) => (
        <View key={group.groupKey} style={styles.groupRow}>
          <MText style={styles.timeCol}>{group.timeLabel}</MText>

          <View style={styles.eventsCol}>
            {group.items.map((item, idx) => (
              <Pressable
                key={item.ev.id}
                onPress={() => pressEvent?.(item.ev.id, item.ev.start)}
                style={[
                  styles.eventBlock,
                  idx < group.items.length - 1 && styles.eventBlockGap,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${item.range}`}
              >
                <View style={styles.titleRow}>
                  <View
                    style={[styles.dot, { backgroundColor: item.color }]}
                  />
                  <MText style={styles.title} numberOfLines={2}>
                    {item.title}
                  </MText>
                </View>
                {item.range && item.range !== group.timeLabel ? (
                  <MText style={styles.range} numberOfLines={1}>
                    {item.range}
                  </MText>
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: spacing.lg },

  empty: { paddingVertical: spacing.md },
  emptyText: {
    color: colors.textSecondary ?? colors.textPrimary,
    opacity: 0.7,
  },

  groupRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    gap: spacing.sm,
  },

  timeCol: {
    width: TIME_COL_W,
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    paddingTop: 2,
    flexShrink: 0,
  },

  eventsCol: {
    flex: 1,
    minWidth: 0,
  },

  eventBlock: {
    gap: 2,
  },

  eventBlockGap: {
    marginBottom: spacing.sm,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  dot: {
    width: DOT,
    height: DOT,
    borderRadius: 999,
    flexShrink: 0,
  },

  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  range: {
    marginLeft: DOT + spacing.sm,
    fontSize: 12,
    color: colors.textSecondary ?? colors.textPrimary,
    opacity: 0.75,
  },
});
