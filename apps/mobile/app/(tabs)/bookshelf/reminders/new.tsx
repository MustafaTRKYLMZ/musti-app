import React from "react";
import { Stack } from "expo-router";
import { useTranslation } from "@musti/core";
import { ReminderEditorScreen } from "@/components/screens/reminders/ReminderEditorScreen";

export default function BookshelfRemindersNew() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t("bookshelf.reminders.new") }} />
      <ReminderEditorScreen owner="bookshelf" mode="new" />
    </>
  );
}
