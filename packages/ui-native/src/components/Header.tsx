// packages/ui/src/components/Header.tsx
import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { MText } from "./MText";
import { spacing } from "../theme";
import { useTheme } from "../theme/ThemeContext";

interface HeaderProps {
  title: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  titleColor?: string; // override if needed
}

export const Header: React.FC<HeaderProps> = ({
  title,
  right,
  style,
  titleColor,
}) => {
  const theme = useTheme();
  const { colors } = theme;

  return (
    <View style={[styles.container, style]}>
      <MText
        variant="heading2"
        color={titleColor ? undefined : "textPrimary"}
        style={titleColor ? { color: titleColor } : undefined}
      >
        {title}
      </MText>

      <View style={styles.right}>{right}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  right: {
    marginLeft: "auto",
  },
});
