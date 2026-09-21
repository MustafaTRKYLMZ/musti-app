import React, { useRef, useState } from "react";
import { StyleSheet, StyleProp, ViewStyle, View } from "react-native";
import { spacing } from "@musti/ui-native";
import { AppSwitcherMenu } from "./AppSwitcherMenu";
import { HeaderIconButton } from "@/components/ui/HeaderIconButton";

type Props = { style?: StyleProp<ViewStyle> };

export function AppSwitcherButton({ style }: Props) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<View | null>(null);

  return (
    <View style={styles.switcherButton}>
      <View ref={anchorRef} collapsable={false}>
        <HeaderIconButton
          icon="apps-outline"
          accessibilityLabel="Open app switcher"
          onPress={() => setOpen(true)}
          style={style}
        />
      </View>

      <AppSwitcherMenu visible={open} onClose={() => setOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  switcherButton: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.xs,
  },
});
