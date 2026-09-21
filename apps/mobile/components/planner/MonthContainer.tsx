import React, { FC, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  LayoutChangeEvent,
  Pressable,
} from "react-native";
import type { CalendarConfig, MEvent } from "@musti/planner/src/types";
import { plannerTheme, spacing, typography, MText } from "@musti/ui-native";
import { MonthView } from "./MonthView";
import { MonthDayEventsList } from "./MonthDayEventsList";
import { clamp } from "@musti/planner";
import { useCalendar } from "@/hooks/useCalendar";
import { useTranslation } from "@musti/core";

const { colors } = plannerTheme;

export type MonthContainerProps = {
  config: CalendarConfig;
  colWidth: number;
  locale?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
};

export const MonthContainer: FC<MonthContainerProps> = ({
  config,
  colWidth,
  locale,
  onRefresh,
  refreshing,
}) => {
  const { t } = useTranslation();
  const { date, openDayModal, closeDayModal, events } = useCalendar();

  const expandedAgendaH = useRef(0);
  const agendaValueRef = useRef(0);

  const agendaH = useRef(new Animated.Value(0)).current;

  const monthAreaH = useRef(0);
  const gridH = useRef(new Animated.Value(0)).current;

  // true = calendar full screen (agenda collapsed), titles on grid
  const [gridExpanded, setGridExpanded] = useState(false);

  const setGridExpandedFromAgenda = (agendaValue: number) => {
    const next = agendaValue <= 1;
    setGridExpanded((prev) => (prev === next ? prev : next));
  };

  const agendaDateLabel = useMemo(() => {
    return date
      .toLocaleDateString(locale ?? config.locale, {
        month: "short",
        day: "numeric",
      })
      .replace(/\.$/, "");
  }, [date, locale, config.locale]);

  const syncHeights = (containerH: number) => {
    monthAreaH.current = containerH;

    const maxAgenda = Math.min(320, Math.floor(containerH * 0.38));
    expandedAgendaH.current = maxAgenda;

    agendaValueRef.current = maxAgenda;
    agendaH.setValue(maxAgenda);

    const monthGridExpanded = Math.max(0, containerH - maxAgenda - 1);
    gridH.setValue(monthGridExpanded);

    setGridExpandedFromAgenda(maxAgenda);
  };

  const onMonthLayout = (e: LayoutChangeEvent) => {
    syncHeights(e.nativeEvent.layout.height);
  };

  const panStartAgenda = useRef(0);

  const animateTo = (targetAgenda: number) => {
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
    setGridExpandedFromAgenda(targetAgenda);
  };

  const openAgenda = () => animateTo(expandedAgendaH.current);
  const closeAgenda = () => animateTo(0);

  const toggleAgenda = () => {
    if (agendaValueRef.current <= 1) {
      openAgenda();
    } else {
      closeAgenda();
    }
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

          setGridExpandedFromAgenda(nextAgenda);
        },
        onPanResponderRelease: (_, g) => {
          const threshold = expandedAgendaH.current * 0.5;
          const shouldOpen = agendaValueRef.current > threshold || g.vy < -0.3;

          const targetAgenda = shouldOpen ? expandedAgendaH.current : 0;
          animateTo(targetAgenda);
        },
      }),
    [agendaH, gridH]
  );

  return (
    <View style={styles.wrap} onLayout={onMonthLayout}>
      <Animated.View
        style={[styles.gridWrap, { height: gridH }]}
        {...panResponder.panHandlers}
      >
        <MonthView
          config={config}
          colWidth={colWidth}
          events={events}
          expanded={gridExpanded}
          gridHeightAnim={gridH}
          locale={locale}
          onPressDay={(d) => {
            if (gridExpanded) {
              openDayModal(d);
            } else {
              closeDayModal();
            }
          }}
        />
      </Animated.View>

      <Pressable
        onPress={toggleAgenda}
        style={styles.handleRow}
        accessibilityRole="button"
        accessibilityLabel={
          gridExpanded
            ? t("planner.agenda.showList")
            : t("planner.agenda.expandCalendar")
        }
      >
        <View style={styles.handle} />
      </Pressable>

      <Animated.View style={[styles.agenda, { height: agendaH }]}>
        <View
          style={styles.agendaInner}
          pointerEvents={gridExpanded ? "none" : "auto"}
        >
          <View style={styles.agendaHeader}>
            <MText style={styles.agendaDate}>{agendaDateLabel}</MText>
          </View>
          <MonthDayEventsList
            date={date}
            events={events}
            onTop={() => closeAgenda()}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  gridWrap: { overflow: "hidden" },
  handleRow: {
    alignItems: "center",
    paddingVertical: spacing.xs,
    backgroundColor: colors.background,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.borderSubtle,
  },
  agenda: { backgroundColor: colors.background },
  agendaInner: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  agendaHeader: {
    marginBottom: spacing.sm,
  },
  agendaDate: {
    fontSize: typography.heading4.fontSize,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
