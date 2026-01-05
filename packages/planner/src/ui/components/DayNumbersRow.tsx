// components/DayNumbersRow.tsx
import React, { FC } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { sameDay } from "../../engine/helpers";
import { spacing } from "@musti/ui-native";
import { Day } from "./Day";

const pad2 = (n: number) => String(n).padStart(2, "0");
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export type DayNumbersRowProps = {
  days: Date[];
  today: Date;
  colWidth: number;
  gap: number;

  onPressDay?: (d: Date) => void;
  selectedDate?: Date;

  markersByDayKey?: Record<string, string[]>;
  maxMarkers?: number;

  containerStyle?: StyleProp<ViewStyle>;
};

export const DayNumbersRow: FC<DayNumbersRowProps> = ({
  days,
  today,
  colWidth,
  gap,
  onPressDay,
  selectedDate,
  markersByDayKey,
  maxMarkers = 4,
  containerStyle,
}) => {
  return (
    <View style={[styles.row, containerStyle]}>
      {days.map((d, i) => {
        const isLastInWeek = i % 7 === 6;
        const k = dayKey(d);
        const markers = markersByDayKey?.[k];

        return (
          <View
            key={`${d.toISOString()}-${i}`}
            style={[
              styles.slot,
              { width: colWidth, marginRight: isLastInWeek ? 0 : gap },
            ]}
          >
            <Day
              date={d}
              width={colWidth}
              isToday={sameDay(d, today)}
              isSelected={selectedDate ? sameDay(d, selectedDate) : false}
              onPress={onPressDay}
              markers={markers}
              maxMarkers={4}
              markerMode="row"
            />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  slot: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xs,
  },
});
