import React, { FC } from "react";
import { View, StyleSheet } from "react-native";
import { MText, plannerTheme } from "@musti/ui-native";

type TimeColumnProps = {
  TIME_COL_WIDTH: number;
  weekView: {
    startHour: number;
    endHour: number;
  };
  hourHeight?: number;
};
const { colors } = plannerTheme;
export const TimeColumn: FC<TimeColumnProps> = ({
  TIME_COL_WIDTH,
  weekView,
  hourHeight = 60,
}) => {
  return (
    <View style={{ width: TIME_COL_WIDTH }}>
      {Array.from({
        length: weekView.endHour - weekView.startHour + 1,
      }).map((_, i) => {
        const hour = weekView.startHour + i;
        const displayHour = hour % 24; // ✅ 24 → 0

        return (
          <MText key={hour} style={[styles.timeLabel, { height: hourHeight }]}>
            {String(displayHour).padStart(2, "0")}
          </MText>
        );
      })}
    </View>
  );
};
const styles = StyleSheet.create({
  timeLabel: {
    fontSize: 11,
    color: colors.textPrimary,
    paddingTop: 2,
    textAlign: "right",
    paddingRight: 4,
  },
});
