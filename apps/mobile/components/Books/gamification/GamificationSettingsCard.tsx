import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useTranslation } from "@musti/core";
import { MText, bookshelfTheme } from "@musti/ui-native";

import { useGamificationSettingsStore } from "@/store/bookshelf/readingGamification/useGamificationSettingsStore";
import { Stepper } from "./Stepper";
import { scheduleMotivationNudgeIfNeeded } from "@/utils/motivation";
import { useToast } from "@/components/ui/ToastProvider";
import { RowAction } from "@/components/ui/RowAction";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { WEEKDAYS } from "@/constants/weekdays";
import { AppChip } from "@/components/ui/AppChip";

const { colors, spacing, radii } = bookshelfTheme;

type Props = {
  inModal?: boolean;
  /** Inside settings collapsible — no outer card/title chrome */
  embedded?: boolean;
};

export function GamificationSettingsCard({
  inModal = false,
  embedded = false,
}: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  useEffect(() => {
    useGamificationSettingsStore.getState().hydrate();
  }, []);

  const hydrated = useGamificationSettingsStore((s) => s.hydrated);
  const settings = useGamificationSettingsStore((s) => s.settings);
  const update = useGamificationSettingsStore((s) => s.update);
  const reset = useGamificationSettingsStore((s) => s.reset);

  const [showTime, setShowTime] = useState(false);

  const preview = useMemo(() => {
    const pages = 20;
    const xpPerPage = Math.max(0, Number(settings.xpPerPage ?? 0));
    const base = pages * xpPerPage;
    const plan = Math.round(base * Number(settings.planMultiplier ?? 1));
    const target = Math.round(base * Number(settings.targetMultiplier ?? 1));
    return { pages, base: Math.round(base), plan, target };
  }, [settings.xpPerPage, settings.planMultiplier, settings.targetMultiplier]);

  const timeLabel = `${String(settings.motivationHour).padStart(
    2,
    "0"
  )}:${String(settings.motivationMinute).padStart(2, "0")}`;

  const onTimeChange = (_e: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== "ios") setShowTime(false);
    if (!date) return;

    update({
      motivationHour: date.getHours(),
      motivationMinute: date.getMinutes(),
    });

    scheduleMotivationNudgeIfNeeded().catch((error) => {
      console.error(
        "Failed to schedule motivation nudge after time change:",
        error
      );
    });
  };

  const onToggleEnabled = async () => {
    await update({ motivationEnabled: !settings.motivationEnabled });
    scheduleMotivationNudgeIfNeeded().catch((error) => {
      console.error("Failed to schedule motivation nudge after toggle:", error);
    });
    showToast({
      title: t("bookshelf.gamification.nudgeTitle"),
      message: !settings.motivationEnabled
        ? t("bookshelf.gamification.enabled")
        : t("bookshelf.gamification.disabled"),
      duration: 2500,
    });
  };

  const setScheduleType = async (t: "daily" | "weekly") => {
    await update({ motivationScheduleType: t });
    scheduleMotivationNudgeIfNeeded().catch((error) => {
      console.error(
        "Failed to schedule motivation nudge after schedule type change:",
        error
      );
    });
  };

  const setWeekday = async (wd: number) => {
    await update({ motivationWeekday: wd });
    scheduleMotivationNudgeIfNeeded().catch((error) => {
      console.error(
        "Failed to schedule motivation nudge after weekday change:",
        error
      );
    });
  };

  const toggleOnlyIfNotDone = async () => {
    await update({
      motivationOnlyIfNotDone: !settings.motivationOnlyIfNotDone,
    });
    scheduleMotivationNudgeIfNeeded().catch((error) => {
      console.error(
        "Failed to schedule motivation nudge after onlyIfNotDone toggle:",
        error
      );
    });
  };

  const onReset = async () => {
    await reset();
    scheduleMotivationNudgeIfNeeded().catch((error) => {
      console.error("Failed to schedule motivation nudge after reset:", error);
    });
    showToast({
      title: t("bookshelf.gamification.title"),
      message: t("bookshelf.gamification.settingsReset"),
      duration: 2500,
    });
  };

  const chipColors = useMemo(
    () => ({
      active: {
        bg: colors.primary,
        border: colors.primary,
        text: colors.textInverse,
        icon: colors.textInverse,
      },
      inactive: {
        bg: colors.surfaceElevated,
        border: colors.borderSubtle,
        text: colors.textPrimary,
        icon: colors.textSecondary,
      },
    }),
    []
  );

  if (!hydrated) return null;

  const cardStyle = embedded
    ? styles.embedded
    : [styles.card, inModal ? styles.cardInModal : null].filter(Boolean);

  const content = (
    <View style={cardStyle}>
      <View style={styles.headerRow}>
        {embedded ? (
          <MText variant="caption" color="textSecondary" style={{ flex: 1 }}>
            {t("bookshelf.gamification.preview")} {preview.pages}{" "}
            {t("bookshelf.streak.pages")} → {preview.base}{" "}
            {t("bookshelf.gamification.previewNormal")} · {preview.plan}{" "}
            {t("bookshelf.gamification.previewPlan")} · {preview.target}{" "}
            {t("bookshelf.gamification.previewTarget")}
          </MText>
        ) : (
          <View style={{ flex: 1, minWidth: 0 }}>
            <MText variant="heading4" color="textPrimary">
              {t("bookshelf.gamification.title")}
            </MText>
            <MText variant="caption" color="textSecondary" numberOfLines={2}>
              {t("bookshelf.gamification.preview")} {preview.pages}{" "}
              {t("bookshelf.streak.pages")} → {preview.base}{" "}
              {t("bookshelf.gamification.previewNormal")} · {preview.plan}{" "}
              {t("bookshelf.gamification.previewPlan")} · {preview.target}{" "}
              {t("bookshelf.gamification.previewTarget")}
            </MText>
          </View>
        )}

        <Pressable onPress={onReset} style={styles.resetBtn}>
          <MText variant="caption" style={{ color: colors.primary, fontWeight: "600" }}>
            {t("bookshelf.gamification.reset")}
          </MText>
        </Pressable>
      </View>

      <View style={{ height: spacing.sm }} />

      <Stepper
        label={t("bookshelf.gamification.dailyStreakGoal")}
        info={{
          title: t("bookshelf.gamification.dailyStreakGoalTitle"),
          message: t("bookshelf.gamification.dailyStreakGoalInfo"),
        }}
        value={settings.qualifyPagesPerDay}
        min={1}
        max={200}
        step={1}
        onChange={(v) => update({ qualifyPagesPerDay: v })}
      />

      <Stepper
        label={t("bookshelf.gamification.xpPerPage")}
        info={{
          title: t("bookshelf.gamification.xpPerPage"),
          message: t("bookshelf.gamification.xpPerPageInfo"),
        }}
        value={settings.xpPerPage}
        min={0}
        max={20}
        step={1}
        onChange={(v) => update({ xpPerPage: v })}
      />

      <Stepper
        label={t("bookshelf.gamification.planMultiplier")}
        info={{
          title: t("bookshelf.gamification.planMultiplier"),
          message: t("bookshelf.gamification.planMultiplierInfo"),
        }}
        value={Math.round(settings.planMultiplier * 100)}
        valueLabel={`${Math.round(settings.planMultiplier * 100)}%`}
        min={100}
        max={300}
        step={5}
        onChange={(v) => update({ planMultiplier: v / 100 })}
      />

      <Stepper
        label={t("bookshelf.gamification.targetMultiplier")}
        info={{
          title: t("bookshelf.gamification.targetMultiplier"),
          message: t("bookshelf.gamification.targetMultiplierInfo"),
        }}
        value={Math.round(settings.targetMultiplier * 100)}
        valueLabel={`${Math.round(settings.targetMultiplier * 100)}%`}
        min={100}
        max={500}
        step={5}
        onChange={(v) => update({ targetMultiplier: v / 100 })}
      />

      <Stepper
        label={t("bookshelf.gamification.planBonus")}
        info={{
          title: t("bookshelf.gamification.planBonus"),
          message: t("bookshelf.gamification.planBonusInfo"),
        }}
        value={settings.planCompleteBonus}
        min={0}
        max={5000}
        step={50}
        onChange={(v) => update({ planCompleteBonus: v })}
      />

      <Stepper
        label={t("bookshelf.gamification.targetBonus")}
        info={{
          title: t("bookshelf.gamification.targetBonus"),
          message: t("bookshelf.gamification.targetBonusInfo"),
        }}
        value={settings.targetCompleteBonus}
        min={0}
        max={5000}
        step={50}
        onChange={(v) => update({ targetCompleteBonus: v })}
      />

      <View style={styles.divider} />

      <MText variant="heading4" color="textPrimary">
        {t("bookshelf.gamification.motivationNudge")}
      </MText>
      <MText variant="caption" color="textSecondary">
        {t("bookshelf.gamification.motivationNudgeDesc")}
      </MText>

      <View style={{ height: spacing.sm }} />

      <ToggleRow
        label={t("bookshelf.gamification.enableNudge")}
        description={t("bookshelf.gamification.enableNudgeDesc")}
        value={settings.motivationEnabled}
        onToggle={onToggleEnabled}
        onLabel={t("common.on")}
        offLabel={t("common.off")}
      />

      <View style={{ height: spacing.sm }} />

      <ToggleRow
        label={t("bookshelf.gamification.onlyIfNotDone")}
        description={t("bookshelf.gamification.onlyIfNotDoneDesc")}
        value={settings.motivationOnlyIfNotDone}
        onToggle={toggleOnlyIfNotDone}
        onLabel={t("common.on")}
        offLabel={t("common.off")}
      />

      <View style={{ height: spacing.md }} />

      <MText variant="bodyStrong" color="textPrimary">
        {t("bookshelf.gamification.schedule")}
      </MText>

      <View style={styles.rowWrap}>
        <AppChip
          label={t("bookshelf.gamification.daily")}
          active={settings.motivationScheduleType === "daily"}
          onPress={() => setScheduleType("daily")}
          icon="repeat-outline"
          colors={chipColors}
          size="md"
          pill={false}
        />
        <AppChip
          label={t("bookshelf.gamification.weekly")}
          active={settings.motivationScheduleType === "weekly"}
          onPress={() => setScheduleType("weekly")}
          icon="calendar-outline"
          colors={chipColors}
          size="md"
          pill={false}
        />
      </View>

      {settings.motivationScheduleType === "weekly" ? (
        <View style={[styles.rowWrap, { marginTop: spacing.sm }]}>
          {WEEKDAYS.map((d) => (
            <AppChip
              key={d.value}
              label={d.label}
              active={settings.motivationWeekday === d.value}
              onPress={() => setWeekday(d.value)}
              colors={chipColors}
              size="sm"
              pill={false}
            />
          ))}
        </View>
      ) : null}

      <View style={{ marginTop: spacing.md }}>
        <RowAction
          label={t("bookshelf.gamification.time")}
          value={timeLabel}
          icon="time-outline"
          onPress={() => setShowTime(true)}
        />
      </View>

      {showTime ? (
        <DateTimePicker
          mode="time"
          is24Hour={true}
          value={
            new Date(
              2000,
              0,
              1,
              settings.motivationHour,
              settings.motivationMinute
            )
          }
          onChange={onTimeChange}
        />
      ) : null}

      <View style={{ height: spacing.lg }} />
    </View>
  );

  if (!inModal) return content;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: spacing["6xl"] ?? spacing.xl,
      }}
    >
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
  },
  embedded: {
    gap: spacing.sm,
  },
  cardInModal: {
    marginHorizontal: 0,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },

  resetBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceElevated,
  },

  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.md,
  },

  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
