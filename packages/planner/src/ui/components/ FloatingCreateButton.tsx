import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

export function FloatingCreateButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.fab} onPress={onPress}>
      <Text style={styles.plus}>＋</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 18,
    bottom: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2F6FED",
    alignItems: "center",
    justifyContent: "center",
    elevation: 7,
  },
  plus: { fontSize: 32, color: "#fff", marginTop: -2 },
});
