import React, { useMemo, useState, useCallback, JSX } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Pressable,
} from "react-native";

import type { Event, CalendarConfig, WeekViewConfig } from "../types";
import { layoutWeek } from "../engine/weekLayout";
import {
  addDays,
  getISOWeekNumber,
  snapMinutes,
  clamp,
} from "../engine/helpers";
import { DaysHeader } from "./components/DaysHeader";
import { DraggableEventBlock } from "./components/ DraggableEventBlock";

const TIME_COL_WIDTH = 56;
const BOTTOM_PADDING_MINUTES = 60;

type Density = "compact" | "expanded";

export function WeekView(props: {
  date: Date;
  events: Event[];
  config: CalendarConfig;
  weekView: WeekViewConfig;
  locale?: string;

  onPressEvent?: (e: Event) => void;

  // Samsung flow:
  onPressDay?: (day: Date) => void; // open bottom sheet
  onCreate?: (day: Date, startMinute?: number) => void;

  // commit on release:
  onEventChange?: (next: Event) => void;
}) {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const weekStartsOn = props.config.weekStartsOn ?? 1;

  const [density, setDensity] = useState<Density>("compact");

  const daysWidth = SCREEN_WIDTH - TIME_COL_WIDTH;
  const columnWidth = daysWidth / 7;

  const weekNumber = getISOWeekNumber(props.date);

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
    [weekStart, props.weekView, startMinVis, endMinVis]
  );

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.weekNumber}>Week {weekNumber}</Text>
      <DaysHeader
        date={props.date}
        weekStartsOn={weekStartsOn}
        locale={props.locale}
      />

      <ScrollView horizontal>
        <View style={{ flexDirection: "row" }}>
          {/* Time labels */}
          <View style={[styles.timeColumn, { width: TIME_COL_WIDTH }]}>
            {Array.from({
              length: props.weekView.endHour - props.weekView.startHour + 1,
            }).map((_, i) => {
              const h = props.weekView.startHour + i;
              return (
                <Text key={h} style={[styles.timeLabel, { height: 60 }]}>
                  {String(h).padStart(2, "0")}:00
                </Text>
              );
            })}
          </View>

          {/* Vertical scroll grid */}
          <ScrollView onScroll={onVerticalScroll} scrollEventThrottle={16}>
            <View style={{ width: daysWidth, height: totalHeight }}>
              {/* Tap a day column -> open bottom sheet */}
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const dayDate = addDays(weekStart, dayIndex);
                return (
                  <Pressable
                    key={`day-press-${dayIndex}`}
                    onPress={() => props.onPressDay?.(dayDate)}
                    style={{
                      position: "absolute",
                      left: dayIndex * columnWidth,
                      top: 0,
                      width: columnWidth,
                      height: totalHeight,
                    }}
                  />
                );
              })}

              {/* Tap position -> create */}
              {Array.from({ length: 7 }).map((_, dayIndex) => (
                <Pressable
                  key={`slot-press-${dayIndex}`}
                  onPress={(evt) =>
                    handleTapGrid(dayIndex, evt.nativeEvent.locationY)
                  }
                  style={{
                    position: "absolute",
                    left: dayIndex * columnWidth,
                    top: 0,
                    width: columnWidth,
                    height: totalHeight,
                  }}
                />
              ))}

              {/* Grid lines */}
              {renderGridLines(props.weekView, daysWidth)}

              {/* Events */}
              {blocks.map((b) => {
                const left =
                  b.dayIndex * columnWidth + (b.col * columnWidth) / b.colCount;
                const w = columnWidth / b.colCount;

                return (
                  <DraggableEventBlock
                    key={b.id}
                    density={density}
                    weekView={props.weekView}
                    top={b.top}
                    height={b.height}
                    left={left}
                    width={w}
                    event={b.event}
                    dayDate={addDays(weekStart, b.dayIndex)}
                    minMinute={startMinVis}
                    maxMinute={endMinVis}
                    onPress={props.onPressEvent}
                    onChange={props.onEventChange}
                  />
                );
              })}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

function renderGridLines(week: WeekViewConfig, width: number) {
  const lines: JSX.Element[] = [];
  const totalMinutes =
    (week.endHour - week.startHour) * 60 + BOTTOM_PADDING_MINUTES;
  const steps = Math.floor(totalMinutes / week.stepMinutes);

  for (let i = 0; i <= steps; i++) {
    const y = i * week.stepMinutes * week.pxPerMinute;
    lines.push(
      <View key={`line-${i}`} style={[styles.gridLine, { top: y, width }]} />
    );
  }
  return lines;
}

const styles = StyleSheet.create({
  weekNumber: {
    paddingLeft: 12,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "800",
    color: "#444",
    backgroundColor: "#fff",
  },
  timeColumn: { backgroundColor: "#fff" },
  timeLabel: { fontSize: 12, color: "#666", paddingTop: 2 },
  gridLine: {
    position: "absolute",
    left: 0,
    height: 1,
    backgroundColor: "#eee",
  },
});
