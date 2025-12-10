// apps/mobile/components/ui/ComingSoon.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "@budget/ui-native";
import { BaseIcon } from "./AppIcon";
import { iconSizes } from "@budget/ui-native";

export function ComingSoon() {
  return (
    <View style={styles.container}>
      <BaseIcon
        name="sparkles-outline"
        size={50}
        color={colors.surface}
      />
      <Text style={styles.title}>Coming soon</Text>
      <Text style={styles.subtitle}>Something cool is on the way.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    color: "#f9fafb",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 16,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 15,
    marginTop: 6,
    textAlign: "center",
  },
});
