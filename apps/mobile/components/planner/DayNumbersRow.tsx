import React, { FC } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { spacing } from "@musti/ui-native";
import { DayCard } from "./DayCard";
import { pad2, sameDay } from "@musti/planner";
import { useCalendarUiStore } from "@/store/calendar/useCalendarUiStore";
import { useCalendar } from "@/hooks/useCalendar";

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export type DayNumbersRowProps = {
  days: Date[];
  today: Date;
  colWidth: number;
  gap: number;

  markersByDayKey?: Record<string, string[]>;
  maxMarkers?: number;

  containerStyle?: StyleProp<ViewStyle>;
  onPressDay?: (d: Date) => void;
};

export const DayNumbersRow: FC<DayNumbersRowProps> = ({
  days,
  today,
  colWidth,
  gap,
  markersByDayKey,
  containerStyle,
}) => {
  const { selectedDate, openDay } = useCalendar();
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
            <DayCard
              date={d}
              width={colWidth}
              isToday={sameDay(d, today)}
              isSelected={sameDay(d, selectedDate)}
              markers={markers}
              maxMarkers={4}
              markerMode="row"
              onPress={(d) => openDay(d)}
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
