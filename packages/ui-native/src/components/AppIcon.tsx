import React, { useState } from "react";
import {
  StyleSheet,
  ViewStyle,
  StyleProp,
  View,
  Pressable,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { spacing, radii, iconSizes, touchTargets } from "../theme/tokens";
import { colors as defaultColors } from "../theme";
import { MText } from "./MText";
import { useTheme } from "../theme/ThemeContext";

export type IconFamily = "ion" | "material-community" | "feather";

const ICON_SETS: Record<IconFamily, any> = {
  ion: Ionicons,
  "material-community": MaterialCommunityIcons,
  feather: Feather,
};

// ---------- BaseIcon ----------
export type BaseIconProps = {
  family?: IconFamily;
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function BaseIcon({
  family = "ion",
  name,
  size = iconSizes.lg,
  color,
  style,
}: BaseIconProps) {
  const theme = useTheme?.();
  const palette = theme?.colors ?? defaultColors;

  const IconSet = ICON_SETS[family];
  const finalColor = color ?? palette.textPrimary;

  return (
    <IconSet name={name as any} size={size} color={finalColor} style={style} />
  );
}

// ---------- IconButton ----------
export type IconButtonProps = {
  family?: IconFamily;
  name?: string;
  color?: string;
  backgroundColor?: string;
  padding?: number;
  hitSlop?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  rounded?: boolean;
  iconNode?: React.ReactNode;
  size?: number;
  accessibilityLabel?: string;
  disabled?: boolean;
  /** When false, skips the fixed 44×44 control box (e.g. nested in a larger row). */
  control?: boolean;
};

export const IconButton = React.forwardRef<View, IconButtonProps>(
  function IconButton(
    {
      family = "ion",
      name,
      size,
      color,
      backgroundColor,
      padding = spacing.xs,
      hitSlop = spacing.xs,
      style,
      onPress,
      rounded = true,
      iconNode,
      accessibilityLabel,
      disabled = false,
      control = true,
    },
    ref
  ) {
    const theme = useTheme?.();
    const palette = theme?.colors ?? defaultColors;
    const [hovered, setHovered] = useState(false);

    const finalColor = disabled
      ? palette.textSecondary ?? palette.textPrimary
      : color ?? palette.textPrimary;

    const finalBackgroundColor = backgroundColor ?? "transparent";
    const rippleColor = palette.borderSubtle ?? defaultColors.borderSubtle;

    const hoverBackground = disabled
      ? finalBackgroundColor
      : hovered
        ? palette.background
        : finalBackgroundColor;

    const isPressable = !!onPress && !disabled;
    const useControlBox = isPressable && control;
    const iconSize = size ?? touchTargets.controlIcon;

    const content =
      iconNode ??
      (name ? (
        <BaseIcon family={family} name={name} size={iconSize} color={finalColor} />
      ) : null);

    return (
      <Pressable
        ref={ref}
        onPress={disabled ? undefined : onPress}
        hitSlop={useControlBox ? spacing.xs : hitSlop}
        disabled={disabled}
        accessibilityRole={isPressable ? "button" : undefined}
        accessibilityState={{ disabled }}
        accessibilityLabel={accessibilityLabel}
        onHoverIn={disabled ? undefined : () => setHovered(true)}
        onHoverOut={disabled ? undefined : () => setHovered(false)}
        android_ripple={
          disabled || !isPressable
            ? undefined
            : { color: rippleColor, radius: touchTargets.control / 2 }
        }
        style={[
          styles.button,
          useControlBox ? styles.controlButton : null,
          {
            padding: useControlBox ? 0 : padding,
            borderRadius: rounded ? radii.full : radii.md,
            backgroundColor: hoverBackground,
            opacity: disabled ? 0.4 : 1,
            transform: [{ scale: hovered && !disabled ? 1.08 : 1 }],
          },
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }
);

// ---------- IconTile ----------
export type IconTileProps = {
  family?: IconFamily;
  name: string;
  size?: number;
  color?: string;
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  iconBackgroundColor?: string;
  labelColor?: string;
  disabled?: boolean;
};

export function IconTile({
  family = "ion",
  name,
  size = iconSizes.lg,
  color,
  label,
  onPress,
  style,
  backgroundColor,
  iconBackgroundColor,
  labelColor,
  disabled = false,
}: IconTileProps) {
  const theme = useTheme?.();
  const palette = theme?.colors ?? defaultColors;
  const [hovered, setHovered] = useState(false);

  const Wrapper: any = onPress && !disabled ? Pressable : View;

  const tileBackground = backgroundColor ?? palette.background;
  const tileIconBackground = iconBackgroundColor ?? palette.background;

  const finalIconColor = disabled
    ? palette.textSecondary ?? palette.textPrimary
    : color ?? palette.primary;

  const finalLabelColor = disabled
    ? palette.textSecondary ?? palette.textPrimary
    : labelColor ?? palette.textPrimary;

  return (
    <Wrapper
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onHoverIn={disabled ? undefined : () => setHovered(true)}
      onHoverOut={disabled ? undefined : () => setHovered(false)}
      style={[
        styles.tile,
        {
          backgroundColor: tileBackground,
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale: hovered && !disabled ? 1.04 : 1 }],
          shadowOpacity: hovered && !disabled ? 0.24 : 0.12,
          minHeight: onPress ? touchTargets.minimum : undefined,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.tileIconWrapper,
          {
            backgroundColor:
              hovered && !disabled ? palette.borderSubtle : tileIconBackground,
          },
        ]}
      >
        <BaseIcon
          family={family}
          name={name}
          size={size}
          color={finalIconColor}
        />
      </View>

      <MText style={[styles.tileLabel, { color: finalLabelColor }]}>
        {label}
      </MText>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
  },
  controlButton: {
    width: touchTargets.control,
    height: touchTargets.control,
    minWidth: touchTargets.control,
    minHeight: touchTargets.control,
  },
  tile: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  tileIconWrapper: {
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.xs,
  },
  tileLabel: {
    textAlign: "center",
    fontSize: 13,
  },
});
