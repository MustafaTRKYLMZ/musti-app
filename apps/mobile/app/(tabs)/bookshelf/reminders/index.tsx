import React from "react";
import { Stack } from "expo-router";
import { useTranslation } from "@musti/core";
import { RemindersListScreen } from "@/components/screens/reminders/RemindersListScreen";

export default function BookshelfRemindersIndex() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t("bookshelf.reminders.title") }} />
      <RemindersListScreen owner="bookshelf" />
    </>
  );
}
