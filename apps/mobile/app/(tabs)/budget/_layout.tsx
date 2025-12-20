import React from "react";
import { Slot } from "expo-router";
import { budgetTheme, ThemeProvider } from "@budget/ui-native";

export default function BookshelfTabLayout() {
  return (
    <ThemeProvider theme={budgetTheme}>
      <Slot />
    </ThemeProvider>
  );
}
