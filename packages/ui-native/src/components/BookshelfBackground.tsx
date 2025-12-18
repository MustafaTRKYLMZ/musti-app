import React from "react";
import { StyleSheet, ViewStyle, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { gradients } from "../theme";
import { WoodGrainOverlay } from "./WoodGrainOverlay";

type BookshelfBackgroundProps = {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export function BookshelfBackground({
  children,
  style,
}: BookshelfBackgroundProps) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={gradients.bookshelfBackground}
        style={[styles.gradient, style]}
      >
        {/* ✅ dolap/ahşap panel damar overlay */}
        <WoodGrainOverlay opacity={0.22} lineCount={24} scale={1} />

        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  gradient: { flex: 1 },
});
