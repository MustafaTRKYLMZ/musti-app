import React from "react";
import { Stack } from "expo-router";
import { ReminderEditorScreen } from "@/components/reminders/ReminderEditorScreen";

export default function BudgetRemindersNew() {
  return (
    <>
      <Stack.Screen options={{ title: "New reminder" }} />
      <ReminderEditorScreen owner="budget" mode="new" />
    </>
  );
}
