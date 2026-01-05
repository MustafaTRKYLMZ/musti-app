import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { FAB, spacing } from "@musti/ui-native";

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
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          delayLongPress={350}
          hitSlop={12}
        >
          <FAB onPress={() => {}} offsetBottom={0} />
        </Pressable>
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
