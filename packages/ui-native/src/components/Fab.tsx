import React, { ReactNode } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
  ViewStyle,
  StyleProp,
} from "react-native";
import { spacing, radii, iconSizes } from "../theme";
import { useTheme } from "../theme/ThemeContext";
import { BaseIcon } from "./AppIcon";

interface FABProps {
  onPress?: (e: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  placement?: "bottom-right" | "bottom-left";
  offsetBottom?: number;
  offsetHorizontal?: number;
  backgroundColor?: string;
}

export const FAB: React.FC<FABProps> = ({
  onPress,
  style,
  placement = "bottom-right",
  offsetBottom = spacing["xl"] * 3,
  offsetHorizontal = spacing.xl,
  backgroundColor,
}) => {
  const theme = useTheme();
  const { colors } = theme;

  const positionStyle: ViewStyle =
    placement === "bottom-right"
      ? { right: offsetHorizontal }
      : { left: offsetHorizontal };

  const fabBackgroundColor = backgroundColor ?? colors.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.base,
        { bottom: offsetBottom, backgroundColor: fabBackgroundColor },
        positionStyle,
        style,
      ]}
    >
      <BaseIcon name="add" size={iconSizes.xl} color={colors.textInverse} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
