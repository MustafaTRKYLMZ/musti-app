import React from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { FAB } from "@musti/ui-native";

export function BudgetFabGroup() {
  return (
    <View pointerEvents="box-none" style={styles.root}>
      <FAB
        onPress={() =>
          router.push({
            pathname: "/(modals)/transaction",
            params: { mode: "create", tab: "scan" },
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
});
