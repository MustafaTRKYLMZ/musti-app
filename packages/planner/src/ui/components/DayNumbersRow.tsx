// components/DayNumbersRow.tsx
import React, { FC } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { sameDay } from "../../engine/helpers";
import { spacing } from "@musti/ui-native";
import { Day } from "./Day";

export type DayNumbersRowProps = {
  days: Date[];
  today: Date;
  colWidth: number;
  gap: number;
  containerStyle?: StyleProp<ViewStyle>;
  onPressDay?: (d: Date) => void;
  selectedDate?: Date;
};

export const DayNumbersRow: FC<DayNumbersRowProps> = ({
  days,
  today,
  colWidth,
  gap,
  containerStyle,
  onPressDay,
  selectedDate,
}) => {
  return (
    <View style={[styles.row, containerStyle]}>
      {days.map((d, i) => {
        const isLastInWeek = i % 7 === 6;

        return (
          <View
            key={`${d.toISOString()}-${i}`}
            style={[
              styles.slot,
              {
                width: colWidth,
                marginRight: isLastInWeek ? 0 : gap,
              },
            ]}
          >
            <Day
              date={d}
              width={colWidth}
              isToday={sameDay(d, today)}
              isSelected={selectedDate ? sameDay(d, selectedDate) : false}
              onPress={onPressDay}
              height={34 + spacing.xs * 2}
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
