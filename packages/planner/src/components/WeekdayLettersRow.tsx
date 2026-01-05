import React, { FC } from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { getWeekdayLetter } from "../engine/helpers";
import { plannerTheme, sizes, spacing } from "@musti/ui-native";

const { colors } = plannerTheme;

export type WeekdayLettersRowProps = {
  days: Date[];
  locale?: string;
  colWidth: number;
  gap: number;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: any;
};

export const WeekdayLettersRow: FC<WeekdayLettersRowProps> = ({
  days,
  locale,
  colWidth,
  gap,
  containerStyle,
  textStyle,
}) => {
  const weekDays = days.slice(0, 7);

  return (
    <View style={[styles.row, containerStyle]}>
      {weekDays.map((d, i) => {
        const isLast = i === 6;

        return (
          <View
            key={`${d.toISOString()}-${i}`}
            style={[
              styles.cell,
              { width: colWidth, marginRight: isLast ? 0 : gap },
            ]}
          >
            <Text style={[styles.text, textStyle]}>
              {getWeekdayLetter(d, locale)}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  cell: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xs,
  },
  text: {
    fontSize: sizes.sm,
    fontWeight: "600",
    letterSpacing: 0.4,
    color: colors.textPrimary,
  },
});
