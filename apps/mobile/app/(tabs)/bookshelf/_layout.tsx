import React from "react";
import { Slot } from "expo-router";
import {
  BookshelfBackground,
  bookshelfTheme,
  ThemeProvider,
} from "@budget/ui-native";
import { useBookshelfNotificationScheduler } from "@/store/bookshelf/useBookshelfNotificationScheduler";
import { useReminderScheduler } from "@/hooks/useReminderScheduler";

export default function BookshelfTabLayout() {
  return (
    <ThemeProvider theme={bookshelfTheme}>
      <BookshelfBackground>
        <Slot />
      </BookshelfBackground>
    </ThemeProvider>
  );
}
