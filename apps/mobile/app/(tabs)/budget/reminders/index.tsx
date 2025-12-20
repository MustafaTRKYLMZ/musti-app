import React from "react";
import { Stack } from "expo-router";
import { RemindersListScreen } from "@/components/screens/reminders/RemindersListScreen";

export default function BudgetRemindersIndex() {
  return (
    <>
      <Stack.Screen options={{ title: "Reminders" }} />
      <RemindersListScreen owner="budget" />
    </>
  );
}
