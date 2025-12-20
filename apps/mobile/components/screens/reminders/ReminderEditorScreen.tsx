import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
} from "react-native";
import { router } from "expo-router";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { MText, spacing, radii, useTheme, iconSizes } from "@budget/ui-native";

import { useRemindersStore } from "@/store/reminders/useRemindersStore";
import type {
  ReminderOwner,
  ReminderSchedule,
  ReminderTarget,
} from "@/store/reminders/types";
import { AppScreen } from "@/components/AppScreen";
import { BaseIcon, IconButton, IconTile } from "@/components/ui/AppIcon";

type Props = {
  owner: ReminderOwner;
  mode: "new" | "edit";
  reminderId?: string;
};

const WEEKDAYS: { label: string; value: number }[] = [
  { label: "Pzt", value: 1 },
  { label: "Sal", value: 2 },
  { label: "Çar", value: 3 },
  { label: "Per", value: 4 },
  { label: "Cum", value: 5 },
  { label: "Cmt", value: 6 },
  { label: "Paz", value: 7 },
];

export function ReminderEditorScreen({ owner, mode, reminderId }: Props) {
  const theme = useTheme();
  const { colors } = theme;

  // ---- Design tokens  ----
  const cardBg = colors.surface;
  const innerBg = colors.surfaceElevated;
  const border = colors.borderSubtle;

  const text = colors.textPrimary;
  const text2 = colors.textSecondary;
  const textInverse = colors.textInverse;

  const primaryBg = colors.primary;
  const danger = colors.danger;

  const addReminder = useRemindersStore((s) => s.addReminder);
  const updateReminder = useRemindersStore((s) => s.updateReminder);
  const removeReminder = useRemindersStore((s) => s.removeReminder);

  const existing = useRemindersStore((s) =>
    reminderId ? s.reminders.find((r) => r.id === reminderId) : undefined
  );

  const initial = useMemo(() => {
    if (mode === "edit" && existing) return existing;

    return {
      title: "",
      body: "",
      enabled: true,
      target: { type: "general" } as ReminderTarget,
      schedule: { type: "daily", hour: 20, minute: 30 } as ReminderSchedule,
    };
  }, [mode, existing]);

  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [targetType, setTargetType] = useState<ReminderTarget["type"]>(
    initial.target.type
  );

  const [scheduleType, setScheduleType] = useState<ReminderSchedule["type"]>(
    initial.schedule.type
  );
  const [hour, setHour] = useState(
    initial.schedule.type === "once"
      ? new Date(initial.schedule.timestamp).getHours()
      : (initial.schedule as any).hour ?? 20
  );
  const [minute, setMinute] = useState(
    initial.schedule.type === "once"
      ? new Date(initial.schedule.timestamp).getMinutes()
      : (initial.schedule as any).minute ?? 30
  );
  const [weekday, setWeekday] = useState(
    initial.schedule.type === "weekly" ? initial.schedule.weekday : 1
  );
  const [onceDate, setOnceDate] = useState(
    initial.schedule.type === "once"
      ? new Date(initial.schedule.timestamp)
      : new Date()
  );

  const [showTime, setShowTime] = useState(false);
  const [showDate, setShowDate] = useState(false);

  const basePath =
    owner === "bookshelf"
      ? "/(tabs)/bookshelf/reminders"
      : "/(tabs)/budget/reminders";

  const schedule: ReminderSchedule = useMemo(() => {
    if (scheduleType === "daily") return { type: "daily", hour, minute };
    if (scheduleType === "weekly")
      return { type: "weekly", weekday, hour, minute };

    const d = new Date(onceDate);
    d.setHours(hour, minute, 0, 0);
    return { type: "once", timestamp: d.getTime() };
  }, [scheduleType, hour, minute, weekday, onceDate]);

  const target: ReminderTarget = useMemo(() => {
    if (targetType === "plan") return { type: "plan" };
    if (targetType === "book")
      return { type: "book", bookUri: "", bookName: "" };
    if (targetType === "weeklyReport") return { type: "weeklyReport" };
    return { type: "general" };
  }, [targetType]);

  const onTimeChange = (_e: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== "ios") setShowTime(false);
    if (!date) return;
    setHour(date.getHours());
    setMinute(date.getMinutes());
  };

  const onDateChange = (_e: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== "ios") setShowDate(false);
    if (!date) return;
    setOnceDate(date);
  };

  const save = () => {
    if (mode === "new") {
      addReminder({
        owner,
        title: title.trim(),
        body: body.trim(),
        enabled,
        target,
        schedule,
      });
      router.replace(basePath);
      return;
    }

    if (!reminderId) return;
    updateReminder(reminderId, {
      title: title.trim(),
      body: body.trim(),
      enabled,
      target,
      schedule,
    });
    router.replace(basePath);
  };

  const del = () => {
    if (!reminderId) return;
    removeReminder(reminderId);
    router.replace(basePath);
  };

  const Chip = ({
    active,
    label,
    onPress,
  }: {
    active: boolean;
    label: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? primaryBg : innerBg,
          borderColor: border,
        },
      ]}
    >
      <MText style={{ color: active ? textInverse : text }}>{label}</MText>
    </Pressable>
  );

  const RowAction = ({
    label,
    value,
    icon,
    onPress,
  }: {
    label: string;
    value: string;
    icon: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={[styles.rowBtn, { borderColor: border, backgroundColor: innerBg }]}
    >
      <View style={styles.rowBtnLeft}>
        <BaseIcon name={icon as any} size={iconSizes.md} color={text2} />
        <MText style={{ color: text }}>{label}</MText>
      </View>
      <View style={styles.rowBtnRight}>
        <MText style={{ color: text2 }}>{value}</MText>
        <BaseIcon
          name={"chevron-forward" as any}
          size={iconSizes.md}
          color={text2}
        />
      </View>
    </Pressable>
  );

  const titleText = mode === "new" ? "New Reminder" : "Reminder";

  const onBack = () => {
    if (router.canGoBack?.()) router.back();
    else router.replace(basePath);
  };

  return (
    <AppScreen
      title={titleText}
      headerContainerStyle={{
        borderBottomWidth: 0,
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        shadowColor: colors.shadowStrong,
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      }}
      headerLeft={
        <IconButton
          name="chevron-back"
          onPress={onBack}
          size={24}
          color={colors.textPrimary}
        />
      }
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <MText variant="heading2" style={{ color: colors.textPrimary }}>
          {mode === "new" ? "New Reminder" : "Edit Reminder"}
        </MText>

        {/* MAIN CARD */}
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          <MText style={{ color: text2 }}>Title</MText>
          <View
            style={[
              styles.inputWrap,
              { borderColor: border, backgroundColor: innerBg },
            ]}
          >
            <BaseIcon
              name={"text-outline" as any}
              size={iconSizes.md}
              color={text2}
            />
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="E.g: Reading"
              placeholderTextColor={text2}
              style={[styles.inputInline, { color: text }]}
            />
          </View>

          <View style={{ height: spacing.md }} />

          <MText style={{ color: text2 }}>Message</MText>
          <View
            style={[
              styles.inputWrap,
              styles.textareaWrap,
              { borderColor: border, backgroundColor: innerBg },
            ]}
          >
            <BaseIcon
              name={"chatbubble-ellipses-outline" as any}
              size={iconSizes.md}
              color={text2}
            />
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="E.g: Today read 10 pages"
              placeholderTextColor={text2}
              multiline
              disableFullscreenUI
              keyboardType="default"
              style={[styles.inputInline, styles.textarea, { color: text }]}
            />
          </View>

          <View style={{ height: spacing.md }} />

          <View style={styles.row}>
            <MText style={{ color: text2 }}>Status</MText>
            <Pressable
              onPress={() => setEnabled((v) => !v)}
              style={[
                styles.pill,
                {
                  backgroundColor: enabled ? primaryBg : innerBg,
                  borderColor: border,
                },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xs,
                }}
              >
                <BaseIcon
                  name={
                    (enabled
                      ? "checkmark-circle-outline"
                      : "close-circle-outline") as any
                  }
                  size={iconSizes.md}
                  color={enabled ? textInverse : text2}
                />
                <MText style={{ color: enabled ? textInverse : text }}>
                  {enabled ? "Open" : "Close"}
                </MText>
              </View>
            </Pressable>
          </View>
        </View>

        {/* TYPE */}
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          <MText variant="heading3" style={{ color: text }}>
            Type
          </MText>

          <View style={styles.rowWrap}>
            <Chip
              active={targetType === "general"}
              label="General"
              onPress={() => setTargetType("general")}
            />
            <Chip
              active={targetType === "plan"}
              label="Plan"
              onPress={() => setTargetType("plan")}
            />
            <Chip
              active={targetType === "book"}
              label="Book"
              onPress={() => setTargetType("book")}
            />
            <Chip
              active={targetType === "weeklyReport"}
              label="Haftalık Rapor"
              onPress={() => setTargetType("weeklyReport")}
            />
          </View>

          {targetType === "book" ? (
            <MText style={{ marginTop: spacing.sm, color: text2 }}>
              Choose book (bookUri/bookName) We will add next step.
            </MText>
          ) : null}
        </View>

        {/* SCHEDULE */}
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: border },
          ]}
        >
          <MText variant="heading3" style={{ color: text }}>
            Timing
          </MText>

          <View style={styles.rowWrap}>
            <Chip
              active={scheduleType === "daily"}
              label="Daily"
              onPress={() => setScheduleType("daily")}
            />
            <Chip
              active={scheduleType === "weekly"}
              label="Weekly"
              onPress={() => setScheduleType("weekly")}
            />
            <Chip
              active={scheduleType === "once"}
              label="Once"
              onPress={() => setScheduleType("once")}
            />
          </View>

          {scheduleType === "weekly" ? (
            <View style={[styles.rowWrap, { marginTop: spacing.md }]}>
              {WEEKDAYS.map((d) => (
                <Chip
                  key={d.value}
                  active={weekday === d.value}
                  label={d.label}
                  onPress={() => setWeekday(d.value)}
                />
              ))}
            </View>
          ) : null}

          {scheduleType === "once" ? (
            <View style={{ marginTop: spacing.md }}>
              <RowAction
                label="Date"
                value={onceDate.toLocaleDateString()}
                icon="calendar-outline"
                onPress={() => setShowDate(true)}
              />
            </View>
          ) : null}

          <View style={{ marginTop: spacing.md }}>
            <RowAction
              label="Time"
              value={`${String(hour).padStart(2, "0")}:${String(
                minute
              ).padStart(2, "0")}`}
              icon="time-outline"
              onPress={() => setShowTime(true)}
            />
          </View>

          {showDate ? (
            <DateTimePicker
              mode="date"
              value={onceDate}
              onChange={onDateChange}
            />
          ) : null}
          {showTime ? (
            <DateTimePicker
              mode="time"
              value={new Date(2000, 0, 1, hour, minute)}
              onChange={onTimeChange}
              minuteInterval={5}
            />
          ) : null}
        </View>

        {/* ACTIONS */}
        <View style={styles.actionsRow}>
          <IconTile
            label="Cancel"
            name="close-outline"
            onPress={onBack}
            size={iconSizes.lg}
            backgroundColor="transparent"
            iconBackgroundColor={colors.surfaceElevated}
            color={text}
            labelColor={text}
            style={[styles.actionTile, { borderColor: colors.borderSubtle }]}
          />

          <View style={styles.actionsRight}>
            {mode === "edit" ? (
              <IconTile
                label="Delete"
                name="trash-outline"
                onPress={del}
                size={iconSizes.lg}
                backgroundColor="transparent"
                iconBackgroundColor={colors.surfaceElevated}
                color={danger}
                labelColor={danger}
                style={[styles.actionTile, { borderColor: danger }]}
              />
            ) : null}

            <IconTile
              label={mode === "new" ? "Create" : "Save"}
              name="save-outline"
              onPress={save}
              size={iconSizes.lg}
              backgroundColor={primaryBg}
              iconBackgroundColor="rgba(255,255,255,0.16)" // istersen kaldır
              color={textInverse}
              labelColor={textInverse}
              style={[styles.actionTile, { borderColor: "transparent" }]}
            />
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing["3xl"] ?? spacing.xl,
    gap: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
  },

  inputWrap: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  inputInline: {
    flex: 1,
    paddingVertical: 0,
  },
  textareaWrap: {
    minHeight: 110,
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: "top",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  pill: {
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

  primaryBtn: {
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: "center",
  },
  dangerBtn: {
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: "center",
    borderWidth: 1,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  actionBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  actionBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
  },
  tileOutline: {
    borderWidth: 1,
    borderRadius: radii.lg,
    backgroundColor: "transparent",
  },
  tilePrimary: {
    borderRadius: radii.lg,
  },
  actionsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },

  actionTile: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
});
