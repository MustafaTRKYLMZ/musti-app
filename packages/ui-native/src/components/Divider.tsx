import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useTheme, spacing } from "@musti/ui-native";

export type DividerProps = {
  /** vertical space before & after */
  margin?: number;

  /** left inset (Samsung style) */
  inset?: number;

  /** thickness (default hairline) */
  thickness?: number;

  /** override color */
  color?: string;

  style?: ViewStyle;
};

export function Divider({
  margin = spacing.md,
  inset = 0,
  thickness = StyleSheet.hairlineWidth,
  color,
  style,
}: DividerProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.base,
        {
          marginVertical: margin,
          marginLeft: inset,
          height: thickness,
          backgroundColor: color ?? colors.borderSubtle,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
  },
});
