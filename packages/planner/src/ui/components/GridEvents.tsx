import React, { FC, JSX, useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { addDays } from "../../engine/helpers";
import { DraggableEventBlock } from "./DraggableEventBlock";
import { BlockedTime, WeekViewConfig } from "../../types";
import { sizes, plannerTheme } from "@musti/ui-native";

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

  onPressEvent?: (e: any) => void;
  onPressDay?: (day: Date) => void;
  onEventChange?: (next: any) => void;
  handleTapGrid: (dayIndex: number, y: number) => void;

  gridLineStyle: any; // minor
  gridLineStrongStyle?: any; // major (hour)

  todayIndex: number; // -1 if not in this week
  nowY: number | null;
  nowColor?: string;
};

const { colors } = plannerTheme;

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
  nowColor = "#EF4444",
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
      {renderHorizontalLines(
        weekView,
        gridWidth,
        bottomPaddingMinutes,
        gridLineStyle,
        gridLineStrongStyle
      )}

      {/* ✅ NOW LINE: sadece bugünün sütununda */}
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

      {/* ✅ NOW DOT (solda küçük nokta gibi, sadece bugünün sütununda) */}
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

    const isHourLine = minuteFromStart % 60 === 0;

    lines.push(
      <View
        key={`h-line-${i}`}
        style={[
          isHourLine ? majorStyle ?? minorStyle : minorStyle,
          {
            position: "absolute",
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

const styles = StyleSheet.create({
  nowText: {
    fontSize: sizes.sm,
    fontWeight: "800",
    color: colors.textPrimary,
  },
});
