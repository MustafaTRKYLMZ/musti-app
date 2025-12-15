import React from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { ReminderEditorScreen } from "@/components/reminders/ReminderEditorScreen";

export default function BookshelfRemindersEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ title: "Düzenle" }} />
      <ReminderEditorScreen owner="bookshelf" mode="edit" reminderId={id} />
    </>
  );
}
