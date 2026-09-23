import React from "react";
import { Slot } from "expo-router";
import { plannerTheme, ThemeProvider } from "@musti/ui-native";

export default function PlannerTabLayout() {
  return (
    <ThemeProvider theme={plannerTheme}>
      <Slot />
    </ThemeProvider>
  );
}
