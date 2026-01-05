import React, { FC, useMemo } from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { eventToTitle, sameDay } from "../../engine";
import { MEvent } from "../../types";
import { eventToStartDate } from "../../engine/eventToStartDate";
import { eventToTimeLabel } from "../../engine/eventToTimeLabel";
import { MText, plannerTheme } from "@musti/ui-native";

const { colors, spacing } = plannerTheme;

export type MonthDayEventsListProps = {
  date: Date;
  events: MEvent[];
  onPressEvent?: (e: MEvent) => void;
};

export const MonthDayEventsList: FC<MonthDayEventsListProps> = ({
  date,
  events,
  onPressEvent,
}) => {
  const dayEvents = useMemo(() => {
    const filtered = events.filter((ev) => {
      const sd = eventToStartDate(ev as any);
      return sd ? sameDay(sd, date) : false;
    });

    return filtered.sort((a: MEvent, b: MEvent) => {
      const da = eventToStartDate(a)?.getTime() ?? 0;
      const db = eventToStartDate(b)?.getTime() ?? 0;
      return da - db;
    });
  }, [events, date]);

  if (!dayEvents.length) {
    return (
      <View style={styles.agendaEmpty}>
        <MText style={styles.agendaEmptyText}>No events</MText>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.agendaScroll}
      contentContainerStyle={styles.agendaContent}
      showsVerticalScrollIndicator={false}
    >
      {dayEvents.map((ev, i) => {
        const time = eventToTimeLabel(ev as any);
        const title = eventToTitle(ev as any);
        const color = (ev as any)?.color ?? colors.primary;

        return (
          <Pressable
            key={(ev as any)?.id ? String((ev as any).id) : `${i}`}
            onPress={() => onPressEvent?.(ev)}
            style={styles.eventRow}
          >
            <MText style={styles.eventTime}>{time ?? ""}</MText>

            <View style={[styles.eventBar, { backgroundColor: color }]} />

            <MText style={styles.eventTitle} numberOfLines={1}>
              {title}
            </MText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  agendaScroll: {
    flex: 1,
  },
  agendaContent: {
    paddingBottom: spacing.lg,
  },
  agendaEmpty: {
    paddingVertical: spacing.md,
  },
  agendaEmptyText: {
    color: colors.textSecondary ?? colors.textPrimary,
    opacity: 0.7,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  eventTime: {
    width: 56,
    color: colors.textSecondary ?? colors.textPrimary,
    opacity: 0.85,
  },
  eventBar: {
    width: 3,
    height: "70%",
    borderRadius: 2,
    marginHorizontal: spacing.sm,
  },
  eventTitle: {
    flex: 1,
    color: colors.textPrimary,
  },
});
