import React from "react";
import { Pressable, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { BaseIcon, spacing, ThemeColors, useTheme, touchTargets } from "@musti/ui-native";

type Props = {
  icon: string;
  onPress: () => void;
  accessibilityLabel: string;
  iconSize?: number;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
  variant?: "circle" | "plain";
  disabled?: boolean;
};

const CONTROL = touchTargets.control;
const GLYPH = touchTargets.controlIcon;

export function HeaderIconButton({
  icon,
  onPress,
  accessibilityLabel,
  iconSize = GLYPH,
  iconColor,
  style,
  variant = "circle",
  disabled = false,
}: Props) {
  const { colors } = useTheme();

  const surface =
    (colors as ThemeColors).surface ??
    (colors as ThemeColors).backgroundSecondary ??
    colors.background;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={spacing.xs}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        variant === "circle" ? styles.circleBtn : styles.plainBtn,
        variant === "circle"
          ? {
              borderColor: colors.borderSubtle,
              backgroundColor: surface,
              opacity: disabled ? 0.5 : 1,
            }
          : { opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      <BaseIcon
        name={icon}
        size={iconSize}
        color={iconColor ?? colors.textPrimary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circleBtn: {
    width: CONTROL,
    height: CONTROL,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  plainBtn: {
    width: CONTROL,
    height: CONTROL,
    alignItems: "center",
    justifyContent: "center",
  },
});
