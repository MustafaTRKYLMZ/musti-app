import React, { useRef, useState } from "react";
import { StyleSheet, StyleProp, ViewStyle, View } from "react-native";
import { spacing, iconSizes, useTheme } from "@musti/ui-native";
import { AppSwitcherMenu } from "./AppSwitcherMenu";
import { IconButton } from "@musti/ui-native/src/components/AppIcon";

type Props = { style?: StyleProp<ViewStyle> };

export function AppSwitcherButton({ style }: Props) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<View | null>(null);
  const { colors } = useTheme();

  return (
    <View style={styles.switcherButton}>
      <View ref={anchorRef} collapsable={false}>
        <IconButton
          name="apps-outline"
          family="ion"
          size={iconSizes.xl}
          color={colors.textPrimary}
          onPress={() => setOpen(true)}
          style={[styles.button, style]}
          accessibilityLabel="Open app switcher"
        />
      </View>

      <AppSwitcherMenu visible={open} onClose={() => setOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  button: { padding: spacing.sm },
  switcherButton: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
});
