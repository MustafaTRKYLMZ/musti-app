import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import type { MEvent, CalendarConfig, WeekViewConfig } from "../types";
import { layoutWeek } from "../engine/weekLayout";
import { addDays, snapMinutes, clamp, sameDay } from "../engine/helpers";
import { DaysHeader } from "./components/DaysHeader";
import { plannerTheme } from "@musti/ui-native";
import { TimeColumn } from "./components/TimeColumn";
import { GridEvents } from "./components/GridEvents";

const TIME_COL_WIDTH = 24;
const BOTTOM_PADDING_MINUTES = 60;
const { colors } = plannerTheme;

type Density = "compact" | "expanded";

const pad2 = (n: number) => String(n).padStart(2, "0");

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

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(id);
  }, []);

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

  // ✅ BUGÜN HANGİ SÜTUN?
  const todayIndex = useMemo(() => {
    for (let i = 0; i < 7; i++) {
      if (sameDay(addDays(weekStart, i), now)) return i;
    }
    return -1;
  }, [weekStart, now]);

  const nowInfo = useMemo(() => {
    if (todayIndex < 0) return null;

    const minutes = now.getHours() * 60 + now.getMinutes();
    if (minutes < startMinVis || minutes > endMinVis) return null;

    const y = (minutes - startMinVis) * props.weekView.pxPerMinute;
    const label = `${pad2(now.getHours() % 24)}:${pad2(now.getMinutes())}`;

    return { y, label, todayIndex };
  }, [now, todayIndex, startMinVis, endMinVis, props.weekView.pxPerMinute]);

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
        <View
          style={{
            flexDirection: "row",
            height: totalHeight,
            overflow: "visible",
          }}
        >
          {/* LEFT: TIME COLUMN + NOW LABEL */}
          <TimeColumn
            TIME_COL_WIDTH={TIME_COL_WIDTH}
            weekView={props.weekView}
            hourHeight={hourHeight}
            nowY={nowInfo?.y ?? null}
            nowLabel={nowInfo?.label ?? null}
            nowColor={plannerTheme.colors.warning ?? "#EF4444"}
          />

          {/* RIGHT: GRID + EVENTS + NOW LINE (today column only) */}
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
            nowColor={plannerTheme.colors.warning}
            todayIndex={nowInfo?.todayIndex ?? -1}
            nowY={nowInfo?.y ?? null}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  gridLine: {
    backgroundColor: colors.borderSubtle,
    opacity: 0.35,
  },
  gridLineStrong: {
    backgroundColor: colors.borderSubtle,
    opacity: 0.8,
  },
});
