import React, { FC } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { spacing } from "@musti/ui-native";
import { DayCard, DayBar, DayInlineItem } from "./DayCard";
import { sameDay, toISODateKeyLocal } from "@musti/planner";
import { useCalendar } from "@/hooks/useCalendar";

export type DayNumbersRowProps = {
  days: Date[];
  today: Date;
  colWidth: number;
  gap: number;

  barsByDayKey?: Record<string, DayBar[]>;
  inlineByDayKey?: Record<string, DayInlineItem[]>;

  maxBars?: number;
  maxInlineItems?: number;

  height?: number;
  containerStyle?: StyleProp<ViewStyle>;
  onPressDay?: (d: Date) => void;
};

export const DayNumbersRow: FC<DayNumbersRowProps> = ({
  days,
  today,
  colWidth,
  gap,
  barsByDayKey,
  inlineByDayKey,
  maxBars = 4,
  maxInlineItems = 0,
  height = 44,
  containerStyle,
  onPressDay,
}) => {
  const { selectedDate, openDay } = useCalendar();

  return (
    <View style={[styles.row, containerStyle]}>
      {days.map((d, i) => {
        const isLastInWeek = i % 7 === 6;
        const k = toISODateKeyLocal(d);

        return (
          <View
            key={`${d.toISOString()}-${i}`}
            style={[
              styles.slot,
              { width: colWidth, marginRight: isLastInWeek ? 0 : gap },
            ]}
          >
            <DayCard
              date={d}
              width={colWidth}
              height={height}
              expanded={false}
              isToday={sameDay(d, today)}
              isSelected={sameDay(d, selectedDate)}
              isOutside={false}
              bars={barsByDayKey?.[k]}
              maxBars={maxBars}
              inlineItems={inlineByDayKey?.[k]}
              maxInlineItems={maxInlineItems}
              onPress={(dd) => {
                onPressDay?.(dd);
                openDay(dd);
              }}
            />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  slot: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xs,
  },
});
