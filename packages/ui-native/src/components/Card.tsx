// packages/ui/src/components/Card.tsx
import React from "react";
import {
  View,
  StyleSheet,
  ViewProps,
  StyleProp,
  ViewStyle,
} from "react-native";
import { spacing, radii } from "../theme";
import { useTheme } from "../theme/ThemeContext";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({ style, children, ...rest }) => {
  const theme = useTheme();
  const { colors, shadows } = theme;

  return (
    <View
      style={[
        styles.cardBase,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
          ...shadows.card,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  cardBase: {
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
});
