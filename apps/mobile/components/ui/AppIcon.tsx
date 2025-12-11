import React, { useState } from "react";
import {
  StyleSheet,
  ViewStyle,
  StyleProp,
  View,
  Pressable,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import {
  colors as defaultColors,
  spacing,
  radii,
  iconSizes,
  MText,
  useTheme,
} from "@budget/ui-native";

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
      hitSlop = 8,
      style,
      onPress,
      rounded = true,
      iconNode,
      accessibilityLabel,
    },
    ref
  ) {
    const theme = useTheme?.();
    const palette = theme?.colors ?? defaultColors;
    const [hovered, setHovered] = useState(false);

    const finalColor = color ?? palette.textPrimary;
    const finalBackgroundColor = backgroundColor ?? "transparent";
    const rippleColor = palette.borderSubtle ?? defaultColors.borderSubtle;
    const hoverBackground = hovered ? palette.background : finalBackgroundColor;

    const content =
      iconNode ??
      (name ? (
        <BaseIcon family={family} name={name} size={size} color={finalColor} />
      ) : null);

    return (
      <Pressable
        ref={ref}
        onPress={onPress}
        hitSlop={hitSlop}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        android_ripple={{ color: rippleColor, radius: 22 }}
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.button,
          {
            padding,
            borderRadius: rounded ? radii.full : radii.md,
            backgroundColor: hoverBackground,
            transform: [{ scale: hovered ? 1.08 : 1 }],
          },
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }
);

// ---------- IconTile (icon + label, launcher ) ----------
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
};

export function IconTile({
  family = "ion",
  name,
  size = iconSizes.xl,
  color,
  label,
  onPress,
  style,
  backgroundColor,
  iconBackgroundColor,
  labelColor,
}: IconTileProps) {
  const theme = useTheme?.();
  const palette = theme?.colors ?? defaultColors;
  const [hovered, setHovered] = useState(false);

  const Wrapper: any = onPress ? Pressable : View;

  const tileBackground = backgroundColor ?? palette.background;
  const tileIconBackground = iconBackgroundColor ?? palette.background;
  const finalIconColor = color ?? palette.primary;
  const finalLabelColor = labelColor ?? palette.textPrimary;

  return (
    <Wrapper
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.tile,
        {
          backgroundColor: tileBackground,
          transform: [{ scale: hovered ? 1.04 : 1 }],
          shadowOpacity: hovered ? 0.24 : 0.12,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.tileIconWrapper,
          {
            backgroundColor: hovered
              ? palette.borderSubtle
              : tileIconBackground,
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
