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
};

export function GamificationSettingsCard({ inModal = false }: Props) {
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
      title: "Motivation nudge",
      message: !settings.motivationEnabled ? "Enabled" : "Disabled",
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
      title: "Gamification",
      message: "Settings reset to defaults",
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

  const cardStyle = [styles.card, inModal ? styles.cardInModal : null].filter(
    Boolean
  );

  const content = (
    <View style={cardStyle}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <MText style={{ fontSize: 16, fontWeight: "900" }}>
            Gamification
          </MText>
          <MText style={{ opacity: 0.7, marginTop: 2 }} numberOfLines={2}>
            Preview: {preview.pages} pages → {preview.base} XP (normal) ·{" "}
            {preview.plan} XP (plan) · {preview.target} XP (target)
          </MText>
        </View>

        <Pressable onPress={onReset} style={styles.resetBtn}>
          <MText style={{ color: colors.primary, fontWeight: "900" }}>
            Reset
          </MText>
        </Pressable>
      </View>

      <View style={{ height: spacing.sm }} />

      <Stepper
        label="Daily streak goal (pages)"
        info={{
          title: "Daily streak goal",
          message:
            "Your streak counts for a day if you read at least this many pages.",
        }}
        value={settings.qualifyPagesPerDay}
        min={1}
        max={200}
        step={1}
        onChange={(v) => update({ qualifyPagesPerDay: v })}
      />

      <Stepper
        label="XP per page"
        info={{
          title: "XP per page",
          message: "How much XP you earn for each page you read.",
        }}
        value={settings.xpPerPage}
        min={0}
        max={20}
        step={1}
        onChange={(v) => update({ xpPerPage: v })}
      />

      <Stepper
        label="Plan multiplier"
        info={{
          title: "Plan multiplier",
          message: "XP boost when reading in Plan mode.",
        }}
        value={Math.round(settings.planMultiplier * 100)}
        valueLabel={`${Math.round(settings.planMultiplier * 100)}%`}
        min={100}
        max={300}
        step={5}
        onChange={(v) => update({ planMultiplier: v / 100 })}
      />

      <Stepper
        label="Target multiplier"
        info={{
          title: "Target multiplier",
          message: "XP boost when reading in Target mode.",
        }}
        value={Math.round(settings.targetMultiplier * 100)}
        valueLabel={`${Math.round(settings.targetMultiplier * 100)}%`}
        min={100}
        max={500}
        step={5}
        onChange={(v) => update({ targetMultiplier: v / 100 })}
      />

      <Stepper
        label="Plan completion bonus"
        info={{
          title: "Plan completion bonus",
          message: "Extra XP when you complete your plan.",
        }}
        value={settings.planCompleteBonus}
        min={0}
        max={5000}
        step={50}
        onChange={(v) => update({ planCompleteBonus: v })}
      />

      <Stepper
        label="Target completion bonus"
        info={{
          title: "Target completion bonus",
          message: "Extra XP when you complete a target.",
        }}
        value={settings.targetCompleteBonus}
        min={0}
        max={5000}
        step={50}
        onChange={(v) => update({ targetCompleteBonus: v })}
      />

      <View style={styles.divider} />

      <MText style={{ fontSize: 14, fontWeight: "900" }}>
        Motivation nudge
      </MText>
      <MText style={{ opacity: 0.7, marginTop: 2 }}>
        Optional reminder to protect your streak.
      </MText>

      <View style={{ height: spacing.sm }} />

      <ToggleRow
        label="Enable motivation nudge"
        description="Sends a reminder at your chosen time."
        value={settings.motivationEnabled}
        onToggle={onToggleEnabled}
        onLabel="On"
        offLabel="Off"
      />

      <View style={{ height: spacing.sm }} />

      <ToggleRow
        label="Only if goal not met"
        description="If you already hit the streak goal, don’t send."
        value={settings.motivationOnlyIfNotDone}
        onToggle={toggleOnlyIfNotDone}
        onLabel="On"
        offLabel="Off"
      />

      <View style={{ height: spacing.md }} />

      <MText style={{ fontWeight: "900" }}>Schedule</MText>

      <View style={styles.rowWrap}>
        <AppChip
          label="Daily"
          active={settings.motivationScheduleType === "daily"}
          onPress={() => setScheduleType("daily")}
          icon="repeat-outline"
          colors={chipColors}
          size="md"
          pill={false}
        />
        <AppChip
          label="Weekly"
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
          label="Time"
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
    borderRadius: radii.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
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
