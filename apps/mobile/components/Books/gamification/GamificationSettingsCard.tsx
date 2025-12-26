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
import { MText, bookshelfTheme } from "@budget/ui-native";
import { useGamificationSettingsStore } from "@/store/bookshelf/readingGamification/useGamificationSettingsStore";
import { Stepper } from "./Stepper";
import { BaseIcon } from "@/components/ui/AppIcon";
import { scheduleMotivationNudgeIfNeeded } from "@/utils/motivation";
import { useToast } from "@/components/ui/ToastProvider";

const { colors, spacing, radii, iconSizes } = bookshelfTheme;

const WEEKDAYS: { label: string; value: number }[] = Array.from(
  { length: 7 },
  (_unused, index) => {
    const value = index + 1; // 1 = Monday, ..., 7 = Sunday
    // Use a fixed reference Monday (2020-01-06 is a Monday) and add index days
    const referenceMonday = new Date(Date.UTC(2020, 0, 6));
    const referenceDateForDay = new Date(
      referenceMonday.getTime() + index * 24 * 60 * 60 * 1000
    );
    const label = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
    }).format(referenceDateForDay);

    return { label, value };
  }
);

type Props = {
  inModal?: boolean;
};

function Chip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.surfaceElevated,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      <MText
        style={{
          color: active ? colors.textInverse : colors.textPrimary,
          fontWeight: "700",
        }}
      >
        {label}
      </MText>
    </Pressable>
  );
}

function ToggleRow({
  label,
  sub,
  value,
  onToggle,
}: {
  label: string;
  sub?: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} style={styles.toggleRow}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <MText style={{ fontWeight: "800" }}>{label}</MText>
        {sub ? (
          <MText style={{ opacity: 0.7, marginTop: 2 }} numberOfLines={2}>
            {sub}
          </MText>
        ) : null}
      </View>

      <View
        style={[
          styles.togglePill,
          {
            backgroundColor: value ? colors.success : colors.surfaceElevated,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <MText
          style={{
            color: value ? colors.textInverse : colors.textPrimary,
            fontWeight: "900",
          }}
        >
          {value ? "On" : "Off"}
        </MText>
      </View>
    </Pressable>
  );
}

function RowAction({
  label,
  value,
  icon,
  onPress,
}: {
  label: string;
  value: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.rowBtn,
        {
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surfaceElevated,
        },
      ]}
    >
      <View style={styles.rowBtnLeft}>
        <BaseIcon
          name={icon as any}
          size={iconSizes.md}
          color={colors.textSecondary}
        />
        <MText style={{ color: colors.textPrimary, fontWeight: "800" }}>
          {label}
        </MText>
      </View>
      <View style={styles.rowBtnRight}>
        <MText style={{ color: colors.textSecondary, fontWeight: "900" }}>
          {value}
        </MText>
        <BaseIcon
          name={"chevron-forward" as any}
          size={iconSizes.md}
          color={colors.textSecondary}
        />
      </View>
    </Pressable>
  );
}

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

    scheduleMotivationNudgeIfNeeded().catch(() => {});
  };

  const onToggleEnabled = async () => {
    await update({ motivationEnabled: !settings.motivationEnabled });
    scheduleMotivationNudgeIfNeeded().catch(() => {});
    showToast({
      title: "Motivation nudge",
      message: !settings.motivationEnabled ? "Enabled" : "Disabled",
      duration: 2500,
    });
  };

  const setScheduleType = async (t: "daily" | "weekly") => {
    await update({ motivationScheduleType: t });
    scheduleMotivationNudgeIfNeeded().catch(() => {});
  };

  const setWeekday = async (wd: number) => {
    await update({ motivationWeekday: wd });
    scheduleMotivationNudgeIfNeeded().catch(() => {});
  };

  const toggleOnlyIfNotDone = async () => {
    await update({
      motivationOnlyIfNotDone: !settings.motivationOnlyIfNotDone,
    });
    scheduleMotivationNudgeIfNeeded().catch(() => {});
  };

  const onReset = async () => {
    await reset();
    scheduleMotivationNudgeIfNeeded().catch(() => {});
    showToast({
      title: "Gamification",
      message: "Settings reset to defaults",
      duration: 2500,
    });
  };

  if (!hydrated) return null;

  const cardStyle = [styles.card, inModal ? styles.cardInModal : null] as const;

  const content = (
    <View style={[...cardStyle]}>
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
        sub="Sends a reminder at your chosen time."
        value={settings.motivationEnabled}
        onToggle={onToggleEnabled}
      />

      <View style={{ height: spacing.sm }} />

      <ToggleRow
        label="Only if goal not met"
        sub="If you already hit the streak goal, don’t send."
        value={settings.motivationOnlyIfNotDone}
        onToggle={toggleOnlyIfNotDone}
      />

      <View style={{ height: spacing.md }} />

      <MText style={{ fontWeight: "900" }}>Schedule</MText>
      <View style={styles.rowWrap}>
        <Chip
          active={settings.motivationScheduleType === "daily"}
          label="Daily"
          onPress={() => setScheduleType("daily")}
        />
        <Chip
          active={settings.motivationScheduleType === "weekly"}
          label="Weekly"
          onPress={() => setScheduleType("weekly")}
        />
      </View>

      {settings.motivationScheduleType === "weekly" ? (
        <View style={[styles.rowWrap, { marginTop: spacing.sm }]}>
          {WEEKDAYS.map((d) => (
            <Chip
              key={d.value}
              active={settings.motivationWeekday === d.value}
              label={d.label}
              onPress={() => setWeekday(d.value)}
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

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  togglePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
  },

  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
  },

  rowBtn: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowBtnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rowBtnRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
