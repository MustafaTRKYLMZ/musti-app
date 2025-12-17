import React from "react";
import { Stack } from "expo-router";
import { RemindersListScreen } from "@/components/screens/reminders/RemindersListScreen";

export default function BookshelfRemindersIndex() {
  return (
    <>
      <Stack.Screen options={{ title: "Hatırlatmalar" }} />
      <RemindersListScreen owner="bookshelf" />
    </>
  );
}
