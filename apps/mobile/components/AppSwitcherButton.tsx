// components/AppSwitcherButton.tsx
import React, { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  View,
} from "react-native";
import { colors, spacing, iconSizes } from "@budget/ui-native";
import { AppSwitcherMenu } from "./AppSwitcherMenu";
import { IconButton } from "./ui/AppIcon";

type Props = {
  style?: StyleProp<ViewStyle>;
};

export function AppSwitcherButton({ style }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.switcherButton}>
      <IconButton
        name="apps-outline"
        family="ion"
        size={iconSizes.xl}
        color={colors.textPrimary}
        onPress={() => setOpen(true)}
        style={[styles.button, style]}
      />
      <AppSwitcherMenu visible={open} onClose={() => setOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: spacing.sm,
  },
  switcherButton: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
});
