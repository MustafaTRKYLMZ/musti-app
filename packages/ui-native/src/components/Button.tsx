// packages/ui/src/components/Button.tsx
import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";

import { spacing, radii, typography } from "../theme";
import { useTheme } from "../theme/ThemeContext";

interface ButtonProps {
  title: string;
  onPress?: (e: GestureResponderEvent) => void;
  loading?: boolean;
  disabled?: boolean;

  /** Optional overrides */
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  color?: string;
  textColor?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading,
  disabled,
  style,
  textStyle,
  color,
  textColor,
}) => {
  const theme = useTheme();
  const { colors } = theme;

  const isDisabled = disabled || loading;

  const backgroundColor = color ?? colors.primary;
  const labelColor = textColor ?? colors.textInverse;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor },
        isDisabled && { opacity: 0.6 },
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <Text style={[styles.text, { color: labelColor }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  text: {
    ...typography.bodyStrong,
  },
});
