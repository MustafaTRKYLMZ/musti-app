import React from "react";
import { View, StyleSheet, ActivityIndicator, ViewStyle } from "react-native";
import { useTheme, spacing } from "@musti/ui-native";

export type SpinnerProps = {
  /** show / hide */
  visible?: boolean;

  /** full screen overlay */
  fullscreen?: boolean;

  /** size: "small" | "large" */
  size?: "small" | "large";

  /** override color */
  color?: string;

  /** container style override */
  style?: ViewStyle;
};

export function Spinner({
  visible = true,
  fullscreen = false,
  size = "large",
  color,
  style,
}: SpinnerProps) {
  const { colors } = useTheme();

  if (!visible) return null;

  const spinner = (
    <ActivityIndicator size={size} color={color ?? colors.primary} />
  );

  if (!fullscreen) {
    return <View style={[styles.inline, style]}>{spinner}</View>;
  }

  return (
    <View
      pointerEvents="auto"
      style={[
        styles.overlay,
        { backgroundColor: colors.backdropStrong },
        style,
      ]}
    >
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        {spinner}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inline: {
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },

  card: {
    padding: spacing.lg,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});
