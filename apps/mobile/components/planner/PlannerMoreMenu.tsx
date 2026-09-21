import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { useTranslation } from "@musti/core";
import {
  AppModal,
  BaseIcon,
  Divider,
  MText,
  spacing,
  useTheme,
} from "@musti/ui-native";
import { MenuRow } from "@/components/ui/MenuRow";
import { MSelectBottomSheet } from "@/components/ui/MSelectBottomSheet";
import { CalendarFeedsList } from "@/components/planner/CalendarFeedsList";
import { LanguageSettingsSection } from "@/components/settings/LanguageSettingsSection";
import type { CalendarView } from "@/store/calendar/useCalendarUiStore";

type Props = {
  visible: boolean;
  isSyncing?: boolean;
  view: CalendarView;
  onClose: () => void;
  onSync: () => void;
  onSettings: () => void;
  onChangeView: (view: CalendarView) => void;
};

export function PlannerMoreMenu({
  visible,
  isSyncing = false,
  view,
  onClose,
  onSync,
  onSettings,
  onChangeView,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [calendarsOpen, setCalendarsOpen] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCalendarsOpen(false);
    }
  }, [visible]);

  const viewItems = useMemo(
    () => [
      { id: "day" as const, label: t("planner.view.day") },
      { id: "week" as const, label: t("planner.view.week") },
      { id: "month" as const, label: t("planner.view.month") },
    ],
    [t]
  );

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      variant="sheet"
      title={t("planner.title")}
      heightPct={88}
      actions={{
        showSave: false,
        showDelete: false,
        cancelLabel: t("common.close"),
        onCancel: onClose,
      }}
    >
      <View style={styles.wrap}>
        <LanguageSettingsSection variant="inline" />

        <Divider inset={0} thickness={1} />

        <MenuRow
          icon="refresh-outline"
          label={isSyncing ? t("planner.menu.syncing") : t("planner.menu.sync")}
          color={colors.textPrimary}
          onPress={() => {
            if (!isSyncing) {
              onSync();
            }
            onClose();
          }}
        />
        {isSyncing ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.spinner}
          />
        ) : null}

        <MenuRow
          icon="settings-outline"
          label={t("planner.menu.settings")}
          color={colors.textPrimary}
          onPress={() => {
            onClose();
            onSettings();
          }}
        />

        <Divider inset={0} thickness={1} />

        <MSelectBottomSheet
          label={t("planner.menu.view")}
          placeholder={t("planner.menu.viewPlaceholder")}
          valueId={view}
          items={viewItems}
          onChange={(item) => onChangeView(item.id as CalendarView)}
        />

        <Divider inset={0} thickness={1} />

        <Pressable
          onPress={() => setCalendarsOpen((open) => !open)}
          style={styles.sectionHeader}
          accessibilityRole="button"
          accessibilityState={{ expanded: calendarsOpen }}
          accessibilityLabel={t("planner.menu.calendars")}
        >
          <BaseIcon
            name="calendar-outline"
            color={colors.textPrimary}
          />
          <MText variant="bodyStrong" style={{ color: colors.textPrimary, flex: 1 }}>
            {t("planner.menu.calendars")}
          </MText>
          <BaseIcon
            name={calendarsOpen ? "chevron-up-outline" : "chevron-down-outline"}
            color={colors.textSecondary}
          />
        </Pressable>

        {calendarsOpen ? <CalendarFeedsList /> : null}
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  spinner: {
    alignSelf: "flex-start",
    marginLeft: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
});
