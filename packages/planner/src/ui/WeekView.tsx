import React, { useMemo, useState, useCallback, JSX } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Pressable,
} from "react-native";

import type { MEvent, CalendarConfig, WeekViewConfig } from "../types";
import { layoutWeek } from "../engine/weekLayout";
import { addDays, snapMinutes, clamp } from "../engine/helpers";
import { DaysHeader } from "./components/DaysHeader";
import { DraggableEventBlock } from "./components/DraggableEventBlock";
import { plannerTheme } from "@musti/ui-native";
import { TimeColumn } from "./components/TimeColumn";
import { GridEvents } from "./components/GridEvents";

const TIME_COL_WIDTH = 24;
const BOTTOM_PADDING_MINUTES = 60;
const { colors } = plannerTheme;

type Density = "compact" | "expanded";

export function WeekView(props: {
  date: Date;
  events: MEvent[];
  config: CalendarConfig;
  weekView: WeekViewConfig;
  locale?: string;

  onPressEvent?: (e: MEvent) => void;
  onPressDay?: (day: Date) => void;
  onCreate?: (day: Date, startMinute?: number) => void;
  onEventChange?: (next: MEvent) => void;
  onChangeDate?: (nextDate: Date) => void;
}) {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const weekStartsOn = props.config.weekStartsOn ?? 1;

  const [density, setDensity] = useState<Density>("compact");

  const daysWidth = Math.max(0, SCREEN_WIDTH - TIME_COL_WIDTH);
  const columnWidth = Math.floor(daysWidth / 7);
  const gridWidth = columnWidth * 7;

  const { weekStart, blocks } = useMemo(() => {
    return layoutWeek(
      props.date,
      props.events,
      { weekStartsOn },
      props.weekView
    );
  }, [props.date, props.events, props.weekView, weekStartsOn]);

  const startMinVis = props.weekView.startHour * 60;
  const endMinVis = props.weekView.endHour * 60;

  const totalMinutes =
    (props.weekView.endHour - props.weekView.startHour) * 60 +
    BOTTOM_PADDING_MINUTES;

  const totalHeight = totalMinutes * props.weekView.pxPerMinute;
  const hourHeight = 60 * props.weekView.pxPerMinute;

  const onVerticalScroll = useCallback((e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    setDensity(y > 40 ? "expanded" : "compact");
  }, []);

  const handleTapGrid = useCallback(
    (dayIndex: number, yPx: number) => {
      const dayDate = addDays(weekStart, dayIndex);
      const rawMinute = startMinVis + yPx / props.weekView.pxPerMinute;
      const snapped = snapMinutes(rawMinute, props.weekView.stepMinutes);
      const clampedMin = clamp(
        snapped,
        startMinVis,
        endMinVis - props.weekView.stepMinutes
      );
      props.onCreate?.(dayDate, clampedMin);
    },
    [weekStart, props.weekView, startMinVis, endMinVis, props.onCreate]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DaysHeader
        date={props.date}
        weekStartsOn={weekStartsOn}
        locale={props.locale}
        onChangeDate={(d) => props.onChangeDate?.(d)}
      />

      <ScrollView
        onScroll={onVerticalScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: "row", height: totalHeight }}>
          {/* ===== TIME COLUMN (FIXED LABELS) ===== */}
          <TimeColumn
            TIME_COL_WIDTH={TIME_COL_WIDTH}
            weekView={props.weekView}
            hourHeight={hourHeight}
          />
          {/* ===== GRID + EVENTS ===== */}
          // WeekView.tsx içinde çağırma (TAM)
          <GridEvents
            gridWidth={gridWidth}
            totalHeight={totalHeight}
            weekStart={weekStart}
            onPressDay={props.onPressDay}
            handleTapGrid={handleTapGrid}
            columnWidth={columnWidth}
            blocks={blocks}
            density={density}
            weekView={props.weekView}
            startMinVis={startMinVis}
            endMinVis={endMinVis}
            onPressEvent={props.onPressEvent}
            onEventChange={props.onEventChange}
            bottomPaddingMinutes={BOTTOM_PADDING_MINUTES}
            gridLineStyle={styles.gridLine}
            gridLineStrongStyle={styles.gridLineStrong}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  gridLine: {
    position: "absolute",
    backgroundColor: colors.borderSubtle, // minor
    opacity: 0.35,
  },
  gridLineStrong: {
    position: "absolute",
    backgroundColor: colors.borderSubtle, // major
    opacity: 0.8,
  },
});
