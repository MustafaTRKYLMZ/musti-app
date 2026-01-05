import React, { FC, ReactNode, useMemo } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
  ViewStyle,
  StyleProp,
  Insets,
} from "react-native";
import { spacing, iconSizes } from "../theme";
import { BaseIcon } from "./AppIcon";

export type FABPlacement =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";

export type FABOwner = "budget" | "planner" | "bookshelf";

export type FABTheme = {
  colors?: {
    primary?: string;
    textInverse?: string;
  };
};

export type FABProps = {
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: (e: GestureResponderEvent) => void;

  delayLongPress?: number;
  hitSlop?: number | Insets;

  placement?: FABPlacement;
  offsetVertical?: number;
  offsetHorizontal?: number;

  backgroundColor?: string;
  size?: number;
  elevation?: number;

  iconName?: string;
  iconSize?: number;
  iconColor?: string;

  children?: ReactNode;

  style?: StyleProp<ViewStyle>;

  owner?: FABOwner;

  theme?: FABTheme;
  getTheme?: (owner?: FABOwner) => FABTheme | undefined;
};

export const FAB: FC<FABProps> = ({
  onPress,
  onLongPress,
  delayLongPress = 350,
  hitSlop = 12,

  placement = "bottom-right",
  offsetVertical = spacing["xl"] * 3,
  offsetHorizontal = spacing.xl,

  backgroundColor,
  size = 56,
  elevation = 4,

  iconName = "add",
  iconSize = iconSizes.xl,
  iconColor,

  children,
  style,

  owner = "budget",

  theme,
  getTheme,
}) => {
  const resolvedTheme = useMemo(() => {
    if (theme) return theme;
    if (getTheme) return getTheme(owner);
    return undefined;
  }, [theme, getTheme, owner]);

  const colors = resolvedTheme?.colors;

  const resolvedBg = backgroundColor ?? colors?.primary ?? "#3B82F6";
  const resolvedIconColor = iconColor ?? colors?.textInverse ?? "#fff";

  const positionStyle: ViewStyle = (() => {
    switch (placement) {
      case "bottom-left":
        return { bottom: offsetVertical, left: offsetHorizontal };
      case "top-right":
        return { top: offsetVertical, right: offsetHorizontal };
      case "top-left":
        return { top: offsetVertical, left: offsetHorizontal };
      default:
        return { bottom: offsetVertical, right: offsetHorizontal };
    }
  })();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
      hitSlop={hitSlop}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: resolvedBg,
          elevation,
        },
        positionStyle,
        style,
      ]}
    >
      {children ? (
        children
      ) : (
        <BaseIcon name={iconName} size={iconSize} color={resolvedIconColor} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
