import React from "react";
import { Slot } from "expo-router";
import {
  BookshelfBackground,
  bookshelfTheme,
  ThemeProvider,
} from "/ui-native";

export default function BookshelfTabLayout() {
  return (
    <ThemeProvider theme={bookshelfTheme}>
      <BookshelfBackground>
        <Slot />
      </BookshelfBackground>
    </ThemeProvider>
  );
}
