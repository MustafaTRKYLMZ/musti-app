import React from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "@musti/core";
import { ReminderEditorScreen } from "@/components/screens/reminders/ReminderEditorScreen";

export default function BookshelfRemindersEdit() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen options={{ title: t("bookshelf.reminders.edit") }} />
      <ReminderEditorScreen owner="bookshelf" mode="edit" reminderId={id} />
    </>
  );
}
