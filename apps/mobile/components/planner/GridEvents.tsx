import React, { FC, useMemo } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  RegisteredStyle,
  ViewStyle,
} from "react-native";
import { DraggableEventBlock } from "./DraggableEventBlock";
import { BlockedTime, MEvent, WeekViewConfig } from "@musti/planner/src/types";
import { plannerTheme } from "@musti/ui-native";
import { RenderHorizontalLines } from "./RenderHorizontalLines";
import { addDays } from "@musti/planner";

type GridEventsProps = {
  weekStart: Date;
  blocks: BlockedTime[];
  weekView: WeekViewConfig;

  gridWidth: number;
  totalHeight: number;
  columnWidth: number;

  density: "compact" | "expanded";
  startMinVis: number;
  endMinVis: number;
  bottomPaddingMinutes: number;

  onPressEvent?: (e: MEvent) => void;
  onPressDay?: (day: Date) => void;
  onEventChange?: (next: MEvent) => void;
  handleTapGrid: (dayIndex: number, y: number) => void;

  gridLineStyle: ViewStyle | RegisteredStyle<ViewStyle>; // minor
  gridLineStrongStyle?: ViewStyle | RegisteredStyle<ViewStyle>; // major (hour)

  todayIndex: number; // -1 if not in this week
  nowY: number | null;
  nowColor?: string;
};

export const GridEvents: FC<GridEventsProps> = ({
  gridWidth,
  totalHeight,
  weekStart,
  onPressDay,
  handleTapGrid,
  columnWidth,
  blocks,
  density,
  weekView,
  startMinVis,
  endMinVis,
  onPressEvent,
  onEventChange,
  bottomPaddingMinutes,
  gridLineStyle,
  gridLineStrongStyle,
  todayIndex,
  nowY,
  nowColor,
}) => {
  const nowX = useMemo(() => {
    if (todayIndex < 0) return null;
    return todayIndex * columnWidth;
  }, [todayIndex, columnWidth]);

  return (
    <View style={{ width: gridWidth, height: totalHeight }}>
      {/* === PRESS LAYER === */}
      {Array.from({ length: 7 }).map((_, dayIndex) => {
        const dayDate = addDays(weekStart, dayIndex);
        return (
          <Pressable
            key={`day-${dayIndex}`}
            onPress={() => onPressDay?.(dayDate)}
            onLongPress={(evt) =>
              handleTapGrid(dayIndex, evt.nativeEvent.locationY)
            }
            delayLongPress={180}
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

      {/* === VERTICAL LINES (days) === */}
      {Array.from({ length: 8 }).map((_, i) => (
        <View
          key={`v-line-${i}`}
          style={[
            gridLineStyle,
            {
              position: "absolute",
              top: 0,
              left: i * columnWidth,
              width: 1,
              height: totalHeight,
            },
          ]}
        />
      ))}

      {/* === HORIZONTAL LINES (time) === */}
      <RenderHorizontalLines
        weekView={weekView}
        width={gridWidth}
        bottomPaddingMinutes={bottomPaddingMinutes}
        minorStyle={gridLineStyle}
        majorStyle={gridLineStrongStyle}
      />

      {nowX != null && nowY != null ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: nowX,
            top: nowY,
            width: columnWidth,
            height: 1,
            backgroundColor: nowColor,
            opacity: 0.95,
          }}
        />
      ) : null}

      {nowX != null && nowY != null ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: nowX + 2,
            top: nowY - 3,
            width: 6,
            height: 6,
            borderRadius: 6,
            backgroundColor: nowColor,
          }}
        />
      ) : null}

      {/* === EVENTS === */}
      {blocks.map((b) => {
        const left =
          b.dayIndex * columnWidth + (b.col * columnWidth) / b.colCount;
        const w = columnWidth / b.colCount;

        return (
          <DraggableEventBlock
            key={b.id}
            density={density}
            weekView={weekView}
            top={b.top}
            height={b.height}
            left={left}
            width={w}
            event={b.event}
            dayDate={addDays(weekStart, b.dayIndex)}
            minMinute={startMinVis}
            maxMinute={endMinVis}
            onPress={onPressEvent}
            onChange={onEventChange}
          />
        );
      })}
    </View>
  );
};
