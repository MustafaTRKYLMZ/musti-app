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
import { MText, spacing, radii, useTheme } from "@budget/ui-native";

import { useRemindersStore } from "@/store/reminders/useRemindersStore";
import type {
  ReminderOwner,
  ReminderSchedule,
  ReminderTarget,
} from "@/store/reminders/types";
import { AppScreen } from "../AppScreen";
import { IconButton } from "../ui/AppIcon";

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
  const screenBg = colors.background;
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
        <MText variant="heading2" style={{ color: colors.textInverse }}>
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
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="E.g: Reading"
            placeholderTextColor={text2}
            style={[
              styles.input,
              { color: text, borderColor: border, backgroundColor: innerBg },
            ]}
          />

          <View style={{ height: spacing.md }} />

          <MText style={{ color: text2 }}>Message</MText>
          <TextInput
            value={body}
            onChange={(e) => setBody(e.nativeEvent.text)}
            placeholder="E.g: Today read 10 pages"
            placeholderTextColor={text2}
            multiline
            disableFullscreenUI
            keyboardType="default"
            style={[
              styles.input,
              styles.textarea,
              { color: text, borderColor: border, backgroundColor: innerBg },
            ]}
          />
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
              <MText style={{ color: enabled ? textInverse : text }}>
                {enabled ? "Open" : "Close"}
              </MText>
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
              <Pressable
                onPress={() => setShowDate(true)}
                style={[
                  styles.rowBtn,
                  { borderColor: border, backgroundColor: innerBg },
                ]}
              >
                <MText style={{ color: text }}>Date</MText>
                <MText style={{ color: text2 }}>
                  {onceDate.toLocaleDateString()}
                </MText>
              </Pressable>
            </View>
          ) : null}

          <View style={{ marginTop: spacing.md }}>
            <Pressable
              onPress={() => setShowTime(true)}
              style={[
                styles.rowBtn,
                { borderColor: border, backgroundColor: innerBg },
              ]}
            >
              <MText style={{ color: text }}>Time</MText>
              <MText style={{ color: text2 }}>
                {String(hour).padStart(2, "0")}:
                {String(minute).padStart(2, "0")}
              </MText>
            </Pressable>
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

        <Pressable
          onPress={save}
          style={[styles.primaryBtn, { backgroundColor: primaryBg }]}
        >
          <MText style={{ color: textInverse }}>
            {mode === "new" ? "Create" : "Save"}
          </MText>
        </Pressable>

        {mode === "edit" ? (
          <Pressable
            onPress={del}
            style={[styles.dangerBtn, { borderColor: danger }]}
          >
            <MText style={{ color: danger }}>Delete</MText>
          </Pressable>
        ) : null}
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
  input: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
});
