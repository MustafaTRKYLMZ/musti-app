import React, { useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { MText, spacing, radii, useTheme, touchTargets } from "@musti/ui-native";
import { useTranslation, formatTranslation } from "@musti/core";

import { useRemindersStore } from "@/store/reminders/useRemindersStore";
import type { ReminderOwner, ReminderItem } from "@/store/reminders/types";
import { useShallow } from "zustand/react/shallow";
import { BookshelfSubScreen } from "@/components/Books/BookshelfSubScreen";
import { SectionAddButton } from "@/components/ui/SectionAddButton";
import { bookshelfScreenStyles } from "@/components/Books/bookshelfScreenStyles";
import { WEEKDAYS } from "@/constants/weekdays";
import { AppScreen } from "@/components/AppScreen";
import { IconButton } from "@musti/ui-native";

function formatTime(hour: number, minute: number) {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${hh}:${mm}`;
}

function weekdayLabel(value: number) {
  return WEEKDAYS.find((d) => d.value === value)?.label ?? String(value);
}

export function RemindersListScreen({ owner }: { owner: ReminderOwner }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const reminders = useRemindersStore(
    useShallow((s) => s.reminders.filter((r) => r.owner === owner))
  );

  const updateReminder = useRemindersStore((s) => s.updateReminder);

  const title =
    owner === "bookshelf"
      ? t("bookshelf.reminders.listTitle")
      : t("budget.reminders.listTitle");

  const basePath =
    owner === "bookshelf"
      ? "/(tabs)/bookshelf/reminders"
      : "/(tabs)/budget/reminders";

  const homePath =
    owner === "bookshelf" ? "/(tabs)/bookshelf" : "/(tabs)/budget";

  const scheduleLabel = (r: ReminderItem) => {
    const s = r.schedule;
    if (s.type === "daily") {
      return formatTranslation(t("bookshelf.reminders.scheduleDaily"), {
        time: formatTime(s.hour, s.minute),
      });
    }
    if (s.type === "weekly") {
      return formatTranslation(t("bookshelf.reminders.scheduleWeekly"), {
        day: weekdayLabel(s.weekday),
        time: formatTime(s.hour, s.minute),
      });
    }
    return formatTranslation(t("bookshelf.reminders.scheduleOnce"), {
      datetime: new Date(s.timestamp).toLocaleString(),
    });
  };

  const sorted = useMemo(() => {
    return [...reminders].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [reminders]);

  const addButton = (
    <SectionAddButton
      accessibilityLabel={t("bookshelf.reminders.newButton")}
      onPress={() => router.push(`${basePath}/new`)}
    />
  );

  const listBody = (
    <>
      {sorted.length === 0 ? (
        <View style={bookshelfScreenStyles.listCard}>
          <MText variant="body" color="textSecondary">
            {t("bookshelf.reminders.empty")}
          </MText>
        </View>
      ) : null}

      {sorted.map((r) => (
        <Pressable
          key={r.id}
          onPress={() => router.push(`${basePath}/${r.id}`)}
          style={bookshelfScreenStyles.listCard}
        >
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <MText variant="heading3" color="textPrimary">
                {r.title || t("bookshelf.reminders.untitled")}
              </MText>
              <MText variant="caption" color="textSecondary" style={styles.sub}>
                {scheduleLabel(r)}
              </MText>
            </View>

            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                updateReminder(r.id, { enabled: !r.enabled });
              }}
              style={[
                styles.pill,
                {
                  backgroundColor: r.enabled
                    ? colors.primary
                    : colors.surfaceElevated,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <MText
                variant="caption"
                style={{
                  fontWeight: "600",
                  color: r.enabled ? colors.textInverse : colors.textPrimary,
                }}
              >
                {r.enabled ? t("common.on") : t("common.off")}
              </MText>
            </Pressable>
          </View>
        </Pressable>
      ))}
    </>
  );

  if (owner === "bookshelf") {
    return (
      <BookshelfSubScreen
        title={title}
        fallbackRoute={homePath}
        headerRight={addButton}
      >
        {listBody}
      </BookshelfSubScreen>
    );
  }

  const onBack = () => {
    if (router.canGoBack?.()) router.back();
    else router.replace(homePath);
  };

  return (
    <AppScreen
      variant="budget"
      title={title}
      showMenu={false}
      showSwitcher={false}
      headerLeft={
        <IconButton
          name="chevron-back"
          onPress={onBack}
          color={colors.textPrimary}
        />
      }
      headerRight={addButton}
    >
      <View style={[bookshelfScreenStyles.scrollContent, { flex: 1 }]}>
        {listBody}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  sub: {
    marginTop: spacing.xs,
  },
  pill: {
    minHeight: touchTargets.minimum,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    justifyContent: "center",
  },
});
