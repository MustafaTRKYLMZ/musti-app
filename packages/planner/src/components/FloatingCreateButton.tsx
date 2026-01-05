import React from "react";
import { StyleSheet, View } from "react-native";
import { FAB, getTheme, spacing } from "@musti/ui-native";

export function FloatingCreateButton({
  onPress,
  onLongPress,
}: {
  onPress: () => void;
  onLongPress?: () => void;
}) {
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View pointerEvents="box-none" style={styles.pos}>
        <FAB owner="planner" getTheme={getTheme} onPress={onPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pos: {
    position: "absolute",
    right: spacing.xs,
    bottom: spacing["2xl"],
  },
});
