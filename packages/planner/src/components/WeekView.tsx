import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";

import type { MEvent, CalendarConfig, WeekViewConfig } from "../types";
import { layoutWeek } from "../engine/weekLayout";
import { addDays, snapMinutes, clamp, sameDay, pad2 } from "../engine/helpers";
import { DaysHeader } from "./DaysHeader";
import { plannerTheme } from "@musti/ui-native";
import { TimeColumn } from "./TimeColumn";
import { GridEvents } from "./GridEvents";
import { TIME_COL_WIDTH, BOTTOM_PADDING_MINUTES } from "../config/timeConfigs";

const { colors } = plannerTheme;

type Density = "compact" | "expanded";

const clampNum = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));

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

  const vRef = useRef<ScrollView | null>(null);
  const [viewportH, setViewportH] = useState(0);

  const autoScrollingRef = useRef(false);

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

  const contentHeight = totalMinutes * props.weekView.pxPerMinute;
  const hourHeight = 60 * props.weekView.pxPerMinute;

  const onVerticalScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      if (!autoScrollingRef.current) {
        setDensity(y > 40 ? "expanded" : "compact");
      }
    },
    []
  );

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

  useEffect(() => {
    if (!nowInfo) return;
    if (!viewportH) return;

    const maxScroll = Math.max(0, contentHeight - viewportH);

    const target = clampNum(nowInfo.y - hourHeight, 0, maxScroll);

    autoScrollingRef.current = true;
    requestAnimationFrame(() => {
      vRef.current?.scrollTo({ y: target, animated: false });
      requestAnimationFrame(() => {
        autoScrollingRef.current = false;
      });
    });
  }, [weekStart.getTime(), viewportH]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DaysHeader
        date={props.date}
        weekStartsOn={weekStartsOn}
        locale={props.locale}
        onChangeDate={(d) => props.onChangeDate?.(d)}
        timeColWidth={TIME_COL_WIDTH}
      />

      <ScrollView
        ref={(r) => {
          vRef.current = r;
        }}
        onScroll={onVerticalScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onLayout={(e) => setViewportH(e.nativeEvent.layout.height)}
      >
        <View style={{ flexDirection: "row", height: contentHeight }}>
          <TimeColumn
            TIME_COL_WIDTH={TIME_COL_WIDTH}
            weekView={props.weekView}
            hourHeight={hourHeight}
            bottomPaddingMinutes={BOTTOM_PADDING_MINUTES}
            nowY={nowInfo?.y ?? null}
            nowLabel={nowInfo?.label ?? null}
            nowColor={plannerTheme.colors.primary ?? "#EF4444"}
          />

          <GridEvents
            gridWidth={gridWidth}
            totalHeight={contentHeight}
            weekStart={weekStart}
            columnWidth={columnWidth}
            blocks={blocks}
            density={density}
            weekView={props.weekView}
            startMinVis={startMinVis}
            endMinVis={endMinVis}
            bottomPaddingMinutes={BOTTOM_PADDING_MINUTES}
            gridLineStyle={styles.gridLine}
            gridLineStrongStyle={styles.gridLineStrong}
            onPressDay={props.onPressDay}
            handleTapGrid={handleTapGrid}
            onPressEvent={props.onPressEvent}
            onEventChange={props.onEventChange}
            todayIndex={nowInfo?.todayIndex ?? -1}
            nowY={nowInfo?.y ?? null}
            nowColor={plannerTheme.colors.primary ?? "#EF4444"}
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
