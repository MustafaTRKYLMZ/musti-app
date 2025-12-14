import React from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { ReminderEditorScreen } from "@/components/reminders/ReminderEditorScreen";

export default function BudgetRemindersEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen options={{ title: "Edit reminder" }} />
      <ReminderEditorScreen owner="budget" mode="edit" reminderId={id} />
    </>
  );
}
