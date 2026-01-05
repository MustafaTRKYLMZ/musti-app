import React, { FC, JSX } from "react";
import { View, Pressable } from "react-native";
import { addDays } from "../../engine/helpers";
import { DraggableEventBlock } from "./DraggableEventBlock";
import { MEvent, WeekViewConfig } from "../../types";

type GridEventsProps = {
  weekStart: Date;
  blocks: {
    id: string;
    dayIndex: number;
    col: number;
    colCount: number;
    top: number;
    height: number;
    event: MEvent;
  }[];
  weekView: WeekViewConfig;
  gridWidth: number;
  totalHeight: number;
  density: "compact" | "expanded";
  onPressEvent?: (e: MEvent) => void;
  onPressDay?: (day: Date) => void;
  onEventChange?: (next: MEvent) => void;
  handleTapGrid: (dayIndex: number, y: number) => void;
  columnWidth: number;
  startMinVis: number;
  endMinVis: number;
  bottomPaddingMinutes: number;

  // styles
  gridLineStyle: any; // base (minor)
  gridLineStrongStyle?: any; // major (hour)
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
}) => {
  return (
    <View style={{ width: gridWidth, height: totalHeight }}>
      {/* === DAY PRESS / CREATE LAYER === */}
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

      {/* === VERTICAL DAY GRID LINES === */}
      {Array.from({ length: 8 }).map((_, i) => (
        <View
          key={`v-line-${i}`}
          style={[
            gridLineStyle,
            {
              top: 0,
              left: i * columnWidth,
              width: 3,
              height: totalHeight,
            },
          ]}
        />
      ))}

      {/* === HORIZONTAL TIME GRID LINES (minor + major) === */}
      {renderHorizontalLines(
        weekView,
        gridWidth,
        bottomPaddingMinutes,
        gridLineStyle,
        gridLineStrongStyle
      )}

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

function renderHorizontalLines(
  weekView: WeekViewConfig,
  width: number,
  bottomPaddingMinutes: number,
  minorStyle: any,
  majorStyle?: any
): JSX.Element[] {
  const lines: JSX.Element[] = [];

  const totalMinutes =
    (weekView.endHour - weekView.startHour) * 60 + bottomPaddingMinutes;

  const steps = Math.floor(totalMinutes / weekView.stepMinutes);

  for (let i = 0; i <= steps; i++) {
    const minuteFromStart = i * weekView.stepMinutes;
    const y = minuteFromStart * weekView.pxPerMinute;

    // ✅ hour boundary? (e.g. 0, 60, 120...)
    const isHourLine = minuteFromStart % 60 === 0;

    lines.push(
      <View
        key={`h-line-${i}`}
        style={[
          isHourLine ? majorStyle ?? minorStyle : minorStyle,
          {
            top: y,
            left: 0,
            width,
            height: 1,
          },
        ]}
      />
    );
  }

  return lines;
}
