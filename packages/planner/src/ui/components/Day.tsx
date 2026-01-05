// components/Day.tsx
import React, { FC } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { plannerTheme, radii, typography } from "@musti/ui-native";

const { colors } = plannerTheme;

export type DayProps = {
  date: Date;
  width: number;
  height?: number;

  isToday?: boolean;
  isSelected?: boolean;
  isOutside?: boolean;

  onPress?: (d: Date) => void;

  containerStyle?: StyleProp<ViewStyle>;
  pillStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;

  todayPillStyle?: StyleProp<ViewStyle>;
  todayTextStyle?: StyleProp<TextStyle>;

  outsidePillStyle?: StyleProp<ViewStyle>;
  outsideTextStyle?: StyleProp<TextStyle>;

  selectedStyle?: StyleProp<ViewStyle>;
};

export const Day: FC<DayProps> = ({
  date,
  width,
  height,
  isToday = false,
  isSelected = false,
  isOutside = false,
  onPress,

  containerStyle,
  pillStyle,
  textStyle,
  todayPillStyle,
  todayTextStyle,
  outsidePillStyle,
  outsideTextStyle,
  selectedStyle,
}) => {
  return (
    <Pressable
      onPress={onPress ? () => onPress(date) : undefined}
      style={[
        styles.cell,
        { width, height: height ?? undefined },
        containerStyle,
        isSelected && styles.selected,
        isSelected && selectedStyle,
      ]}
    >
      <View
        style={[
          styles.pill,
          pillStyle,
          isToday && styles.pillToday,
          isToday && todayPillStyle,
          isOutside && styles.pillOutside,
          isOutside && outsidePillStyle,
        ]}
      >
        <Text
          style={[
            styles.text,
            textStyle,
            isToday && styles.todayText,
            isToday && todayTextStyle,
            isOutside && styles.outsideText,
            isOutside && outsideTextStyle,
          ]}
        >
          {date.getDate()}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cell: {
    alignItems: "center",
    justifyContent: "center",
  },
  selected: {
    borderWidth: 1,
    borderColor: colors.textPrimary,
    borderRadius: radii.lg,
  },
  pill: {
    minWidth: 34,
    minHeight: 34,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  pillToday: {
    backgroundColor: colors.backgroundSecondary,
  },
  pillOutside: {
    opacity: 0.5,
  },
  text: {
    fontSize: typography.heading4.fontSize,
    fontWeight: typography.heading4.fontWeight,
    color: colors.textPrimary,
  },
  todayText: {
    color: colors.primary,
  },
  outsideText: {
    color: colors.textSecondary ?? colors.textPrimary,
  },
});
