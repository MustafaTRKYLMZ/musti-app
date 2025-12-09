// components/ui/AppIcon.tsx
import React, { useState } from "react";
import {
  StyleSheet,
  ViewStyle,
  StyleProp,
  View,
  Pressable,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { colors, spacing, radii, iconSizes, MText } from "@budget/ui-native";

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
};

export function BaseIcon({
  family = "ion",
  name,
  size = iconSizes.lg,
  color = colors.textPrimary,
}: BaseIconProps) {
  const IconSet = ICON_SETS[family];
  return <IconSet name={name as any} size={size} color={color} />;
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
};

export function IconButton({
  family,
  name,
  size,
  color = colors.textPrimary,
  backgroundColor = "transparent",
  padding = spacing.xs,
  hitSlop = 8,
  style,
  onPress,
  rounded = true,
  iconNode,
}: IconButtonProps) {
  const [hovered, setHovered] = useState(false);

  const content =
    iconNode ??
    (name ? (
      <BaseIcon family={family} name={name} size={size} color={color} />
    ) : null);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      android_ripple={{ color: colors.borderSubtle, radius: 22 }}
      style={[
        styles.button,
        {
          padding,
          borderRadius: rounded ? radii.full : radii.md,
          backgroundColor: hovered ? colors.background : backgroundColor,
          transform: [{ scale: hovered ? 1.08 : 1 }],
        },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

// ---------- IconTile (icon + label, launcher için) ----------
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
};

export function IconTile({
  family,
  name,
  size = iconSizes.xl,
  color = colors.primary,
  label,
  onPress,
  style,
  backgroundColor = colors.background,
  iconBackgroundColor = colors.background,
}: IconTileProps) {
  const [hovered, setHovered] = useState(false);

  const Wrapper: any = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.tile,
        {
          backgroundColor,
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
              ? colors.borderSubtle
              : iconBackgroundColor,
          },
        ]}
      >
        <BaseIcon family={family} name={name} size={size} color={color} />
      </View>

      <MText style={styles.tileLabel}>{label}</MText>
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
    color: colors.textPrimary,
  },
});
