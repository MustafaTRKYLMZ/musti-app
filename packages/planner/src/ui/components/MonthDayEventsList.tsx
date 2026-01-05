// components/MonthDayEventsList.tsx
import React, { FC, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
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
  onTop?: () => void;
};

export const MonthDayEventsList: FC<MonthDayEventsListProps> = ({
  date,
  events,
  onPressEvent,
  onTop,
}) => {
  const dayEvents = useMemo(() => {
    const filtered = events.filter((ev) => {
      const sd = eventToStartDate(ev as any);
      return sd ? sameDay(sd, date) : false;
    });

    return filtered.sort((a: any, b: any) => {
      const da = eventToStartDate(a)?.getTime() ?? 0;
      const db = eventToStartDate(b)?.getTime() ?? 0;
      return da - db;
    });
  }, [events, date]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!onTop) return;
    const y = e.nativeEvent.contentOffset.y;
    if (y <= 0) onTop();
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
      alwaysBounceVertical
      bounces
      overScrollMode="always"
    >
      {dayEvents.map((ev, i) => {
        const time = eventToTimeLabel(ev as any);
        const title = eventToTitle(ev as any);
        const color = (ev as any)?.color ?? colors.primary;

        return (
          <Pressable
            key={(ev as any)?.id ? String((ev as any).id) : `${i}`}
            onPress={() => onPressEvent?.(ev)}
            style={styles.row}
          >
            <MText style={styles.time}>{time ?? ""}</MText>
            <View style={[styles.bar, { backgroundColor: color }]} />
            <MText style={styles.title} numberOfLines={1}>
              {title}
            </MText>
          </Pressable>
        );
      })}
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
  title: { flex: 1, color: colors.textPrimary },
});
