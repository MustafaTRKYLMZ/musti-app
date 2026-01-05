// MonthContainer.tsx
import React, { FC, useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  LayoutChangeEvent,
} from "react-native";
import type { CalendarConfig, MEvent } from "../types";
import { plannerTheme, spacing, typography } from "@musti/ui-native";
import { MonthView } from "./MonthView";
import { MonthDayEventsList } from "./components/MonthDayEventsList";
import { MText } from "@musti/ui-native";

const { colors } = plannerTheme;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export type MonthContainerProps = {
  date: Date;
  config: CalendarConfig;
  colWidth: number;
  events: MEvent[];
  locale?: string;

  onChangeDate: (d: Date) => void;
  onPressDay?: (d: Date) => void;
  onPressEvent?: (e: MEvent) => void;
};

export const MonthContainer: FC<MonthContainerProps> = ({
  date,
  config,
  colWidth,
  events,
  locale,
  onChangeDate,
  onPressDay,
  onPressEvent,
}) => {
  const expandedAgendaH = useRef(0);
  const agendaValueRef = useRef(0);

  const agendaH = useRef(new Animated.Value(0)).current;

  const monthAreaH = useRef(0);
  const gridH = useRef(new Animated.Value(0)).current;

  const monthLabel = useMemo(() => {
    const d = date;
    const day = d.getDate();
    const mon = d
      .toLocaleDateString(locale ?? config.locale, { month: "short" })
      .replace(".", "");
    return `${day} ${mon}`;
  }, [date, locale, config.locale]);

  const syncHeights = (containerH: number) => {
    monthAreaH.current = containerH;

    const maxAgenda = Math.min(320, Math.floor(containerH * 0.38));
    expandedAgendaH.current = maxAgenda;

    agendaValueRef.current = maxAgenda;
    agendaH.setValue(maxAgenda);

    const monthGridExpanded = Math.max(0, containerH - maxAgenda - 1);
    gridH.setValue(monthGridExpanded);
  };

  const onMonthLayout = (e: LayoutChangeEvent) => {
    syncHeights(e.nativeEvent.layout.height);
  };

  const panStartAgenda = useRef(0);

  const closeAgenda = () => {
    const targetAgenda = 0;
    const targetGrid = Math.max(0, monthAreaH.current - targetAgenda - 1);

    Animated.spring(agendaH, {
      toValue: targetAgenda,
      useNativeDriver: false,
      bounciness: 0,
      speed: 18,
    }).start();

    Animated.spring(gridH, {
      toValue: targetGrid,
      useNativeDriver: false,
      bounciness: 0,
      speed: 18,
    }).start();

    agendaValueRef.current = targetAgenda;
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => {
          const dy = Math.abs(g.dy);
          const vy = Math.abs(g.vy);
          const vx = Math.abs(g.vx);
          if (dy < 6) return false;
          return vy >= vx;
        },
        onPanResponderGrant: () => {
          panStartAgenda.current = agendaValueRef.current;
        },
        onPanResponderMove: (_, g) => {
          const start = panStartAgenda.current;
          const nextAgenda = clamp(start - g.dy, 0, expandedAgendaH.current);

          agendaValueRef.current = nextAgenda;
          agendaH.setValue(nextAgenda);

          const nextGrid = Math.max(0, monthAreaH.current - nextAgenda - 1);
          gridH.setValue(nextGrid);
        },
        onPanResponderRelease: (_, g) => {
          const threshold = expandedAgendaH.current * 0.5;
          const shouldOpen = agendaValueRef.current > threshold || g.vy < -0.3;
          const targetAgenda = shouldOpen ? expandedAgendaH.current : 0;
          const targetGrid = Math.max(0, monthAreaH.current - targetAgenda - 1);

          Animated.spring(agendaH, {
            toValue: targetAgenda,
            useNativeDriver: false,
            bounciness: 0,
            speed: 18,
          }).start();

          Animated.spring(gridH, {
            toValue: targetGrid,
            useNativeDriver: false,
            bounciness: 0,
            speed: 18,
          }).start();

          agendaValueRef.current = targetAgenda;
        },
      }),
    [agendaH, gridH]
  );

  const isCollapsed = agendaValueRef.current <= 1;

  return (
    <View style={styles.wrap} onLayout={onMonthLayout}>
      <Animated.View
        style={[styles.gridWrap, { height: gridH }]}
        {...panResponder.panHandlers}
      >
        <MonthView
          date={date}
          config={config}
          colWidth={colWidth}
          events={events}
          collapsed={isCollapsed}
          onChangeDate={onChangeDate}
          onPressDay={onPressDay}
          maxMarkers={2}
          maxInlineItems={2}
          gridHeightAnim={gridH}
        />
      </Animated.View>

      <View style={styles.bottomDivider} />

      <Animated.View style={[styles.agenda, { height: agendaH }]}>
        <View
          style={styles.agendaInner}
          pointerEvents={isCollapsed ? "none" : "auto"}
        >
          <MText style={styles.agendaTitle}>{monthLabel}</MText>

          <MonthDayEventsList
            date={date}
            events={events}
            onPressEvent={onPressEvent}
            onTop={() => {
              closeAgenda();
            }}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: spacing.md,
  },
  gridWrap: {
    overflow: "hidden",
  },
  bottomDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.textPrimary,
  },
  agenda: {
    backgroundColor: colors.background,
  },
  agendaInner: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  agendaTitle: {
    fontSize: typography.heading4.fontSize,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
});
