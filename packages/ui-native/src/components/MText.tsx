import React from "react";
import { Text, TextProps, TextStyle, StyleProp } from "react-native";
import { typography, colors as defaultColors } from "../theme";
import { useTheme } from "../theme/ThemeContext";

export type TextVariant =
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "body"
  | "bodyStrong"
  | "caption";

// type comes from default colors, but all themes share the same keys
type ColorKey = keyof typeof defaultColors;

interface MTextProps extends TextProps {
  variant?: TextVariant;
  color?: ColorKey;
  style?: StyleProp<TextStyle>;
}

export const MText: React.FC<MTextProps> = ({
  variant = "body",
  color = "textPrimary",
  style,
  children,
  ...rest
}) => {
  const theme = useTheme?.();
  const palette = theme?.colors ?? defaultColors;

  return (
    <Text
      {...rest}
      style={[typography[variant], { color: palette[color] }, style]}
    >
      {children}
    </Text>
  );
};
