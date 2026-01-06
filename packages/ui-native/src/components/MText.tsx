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
  | "caption"
  | "label"; // ✅ NEW

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

  // ✅ typography.label yoksa caption fallback
  const textStyle =
    (typography as any)?.[variant] ?? (typography as any)?.caption;

  return (
    <Text {...rest} style={[textStyle, { color: palette[color] }, style]}>
      {children}
    </Text>
  );
};
