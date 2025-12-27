import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { MText, spacing, radii } from "@budget/ui-native";
import { BaseIcon } from "@/components/ui/AppIcon";

type ChipColors = {
  bg: string;
  border: string;
  text: string;
  icon?: string;
};

export type AppChipProps = {
  label: string;
  active: boolean;
  onPress?: () => void;

  colors: {
    active: ChipColors;
    inactive: ChipColors;
    disabled?: ChipColors;
  };

  icon?: string;
  iconFamily?: "ion" | "material" | "feather" | string;
  iconPosition?: "left" | "right";
  iconSize?: number;

  size?: "sm" | "md" | "lg";
  pill?: boolean;

  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  labelVariant?: "body" | "bodyStrong";

  testID?: string;
};

const sizeMap = {
  sm: { px: spacing.md, py: spacing.xs, radius: radii.md, font: 13 },
  md: { px: spacing.lg, py: spacing.sm, radius: radii.lg, font: 14 },
  lg: {
    px: spacing.xl ?? spacing.lg,
    py: spacing.sm,
    radius: radii.xl,
    font: 15,
  },
} as const;

export function AppChip({
  label,
  active,
  onPress,

  colors,

  icon,
  iconFamily = "ion",
  iconPosition = "left",
  iconSize = 18,

  size = "md",
  pill = false,

  disabled = false,
  style,
  labelVariant = "bodyStrong",

  testID,
}: AppChipProps) {
  const s = sizeMap[size] ?? sizeMap.md;

  const palette = disabled
    ? colors.disabled ?? colors.inactive
    : active
    ? colors.active
    : colors.inactive;

  const radius = pill ? radii.full : s.radius;

  const leftIcon = icon && iconPosition === "left";
  const rightIcon = icon && iconPosition === "right";

  return (
    <Pressable
      testID={testID}
      onPress={disabled ? undefined : onPress}
      disabled={disabled || !onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: active }}
      style={({ pressed }) => {
        const baseOpacity = disabled ? 0.6 : 1;
        const pressOpacity = pressed && !disabled ? 0.92 : 1;

        return [
          styles.base,
          {
            paddingHorizontal: s.px,
            paddingVertical: s.py,
            borderRadius: radius,
            backgroundColor: palette.bg,
            borderColor: palette.border,
            opacity: baseOpacity * pressOpacity,
          },
          style,
        ];
      }}
    >
      <View style={styles.row}>
        {leftIcon ? (
          <BaseIcon
            family={iconFamily as any}
            name={icon as any}
            size={iconSize}
            color={palette.icon ?? palette.text}
          />
        ) : null}

        <MText
          variant={labelVariant as any}
          style={[styles.label, { color: palette.text, fontSize: s.font }]}
          numberOfLines={1}
        >
          {label}
        </MText>

        {rightIcon ? (
          <BaseIcon
            family={iconFamily as any}
            name={icon as any}
            size={iconSize}
            color={palette.icon ?? palette.text}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minWidth: 0,
  },
  label: {
    minWidth: 0,
  },
});
