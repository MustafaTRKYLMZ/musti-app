// components/AppSwitcherButton.tsx
import React, { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, iconSizes } from "@budget/ui-native";
import { AppSwitcherMenu } from "./AppSwitcherMenu";

type Props = {
  style?: StyleProp<ViewStyle>;
};

export function AppSwitcherButton({ style }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.switcherButton}>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[styles.button, style]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name="apps-outline"
          size={iconSizes["xl"]}
          color={colors.textPrimary}
        />
      </TouchableOpacity>

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
