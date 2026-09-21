import React from "react";
import { Stack } from "expo-router";
import { useTranslation } from "@musti/core";

import { BookshelfNotificationsSection } from "@/components/settings/BookshelfNotificationsSection";
import { GamificationSettingsCard } from "@/components/Books/gamification/GamificationSettingsCard";
import { LanguageSettingsSection } from "@/components/settings/LanguageSettingsSection";
import { SettingsCollapsibleSection } from "@/components/settings/SettingsCollapsibleSection";
import { BookshelfSubScreen } from "@/components/Books/BookshelfSubScreen";

export default function BookshelfSettingsScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t("bookshelf.settings.title") }} />
      <BookshelfSubScreen title={t("bookshelf.settings.title")}>
        <SettingsCollapsibleSection
          title={t("settings.language")}
          subtitle={t("settings.languageChangedDesc")}
          defaultOpen
        >
          <LanguageSettingsSection variant="embedded" />
        </SettingsCollapsibleSection>

        <SettingsCollapsibleSection
          title={t("bookshelf.notifications")}
          defaultOpen
        >
          <BookshelfNotificationsSection />
        </SettingsCollapsibleSection>

        <SettingsCollapsibleSection
          title={t("bookshelf.gamification.title")}
          defaultOpen={false}
        >
          <GamificationSettingsCard embedded />
        </SettingsCollapsibleSection>
      </BookshelfSubScreen>
    </>
  );
}
