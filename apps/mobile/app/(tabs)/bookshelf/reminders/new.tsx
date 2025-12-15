import React from "react";
import { Stack } from "expo-router";
import { ReminderEditorScreen } from "@/components/reminders/ReminderEditorScreen";

export default function BookshelfRemindersNew() {
  return (
    <>
      <Stack.Screen options={{ title: "Yeni Hatırlatma" }} />
      <ReminderEditorScreen owner="bookshelf" mode="new" />
    </>
  );
}
