import React, { FC, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";

import { MText, plannerTheme } from "@musti/ui-native";
import {
  addDays,
  eventToStartDate,
  formatTime24,
  sameDay,
  startOfDay,
  MEvent,
} from "@musti/planner";
import { useCalendar } from "@/hooks/useCalendar";
import { eventToTitle } from "@/utils/calendar/format";

const { colors, spacing } = plannerTheme;

/* ================= helpers ================= */

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
  // fallback: very short event
  return new Date(start.getTime() + 60 * 1000);
}

function overlapsDay(ev: MEvent, day: Date) {
  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);

  const evStart = getEventStart(ev);
  if (!evStart) return false;

  const evEnd = getEventEnd(ev, evStart);
  return evStart < dayEnd && evEnd > dayStart;
}

/* ================= component ================= */

export type MonthDayEventsListProps = {
  date: Date;
  events: MEvent[];
  onTop?: () => void;
};

export const MonthDayEventsList: FC<MonthDayEventsListProps> = ({
  date,
  events,
  onTop,
}) => {
  const { pressEvent } = useCalendar();

  const dayEvents = useMemo(() => {
    const filtered = events.filter((ev) => overlapsDay(ev, date));
    return filtered.sort((a, b) => {
      const da = getEventStart(a)?.getTime() ?? 0;
      const db = getEventStart(b)?.getTime() ?? 0;
      return da - db;
    });
  }, [events, date]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!onTop) return;
    if (e.nativeEvent.contentOffset.y <= 0) onTop();
  };

  if (!dayEvents.length) {
    return (
      <View style={styles.empty}>
        <MText style={styles.emptyText}>No events</MText>
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
    >
      {dayEvents.map((ev, i) => {
        const title = eventToTitle(ev as any);
        const color = (ev as any)?.color ?? colors.primary;

        const start = getEventStart(ev);
        const end = start ? getEventEnd(ev, start) : null;

        let time = start ? formatTime24(start) : "";
        let isOngoing = false;

        if (start && end) {
          const isMultiDay =
            startOfDay(start).getTime() !== startOfDay(end).getTime();

          if (isMultiDay) {
            if (sameDay(start, date)) {
              time = formatTime24(start);
              isOngoing = false;
            } else if (sameDay(end, date)) {
              time = formatTime24(end);
              isOngoing = true;
            } else {
              time = "00:00";
              isOngoing = true;
            }
          }
        }

        return (
          <Pressable
            key={(ev as MEvent)?.id ? String((ev as MEvent).id) : `${i}`}
            onPress={() => pressEvent?.(ev.id, (ev as MEvent).start)}
            style={styles.row}
          >
            <MText style={styles.time}>{time}</MText>

            <View style={[styles.bar, { backgroundColor: color }]} />

            <View style={styles.titleWrap}>
              <MText style={styles.title} numberOfLines={1}>
                {title}
              </MText>

              {isOngoing ? (
                <View
                  style={[
                    styles.ongoingPill,
                    { backgroundColor: `${color}22` }, // subtle tint
                  ]}
                >
                  <MText style={[styles.ongoingText, { color }]}>Ongoing</MText>
                </View>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

/* ================= styles ================= */

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: spacing.lg },

  empty: { paddingVertical: spacing.md },
  emptyText: {
    color: colors.textSecondary ?? colors.textPrimary,
    opacity: 0.7,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },

  time: {
    width: 56,
    color: colors.textSecondary ?? colors.textPrimary,
    opacity: 0.85,
  },

  bar: {
    width: 3,
    height: "70%",
    borderRadius: 2,
    marginHorizontal: spacing.sm,
  },

  titleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  title: {
    flex: 1,
    color: colors.textPrimary,
  },

  ongoingPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },

  ongoingText: {
    fontSize: 11,
    fontWeight: "800",
  },
});
