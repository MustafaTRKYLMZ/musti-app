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
import { BookPickerModal } from "@/components/Books/reminders/BookPickerModal";
import { PlanPickerModal } from "@/components/Books/reminders/PlanPickerModal";
import { TargetPickerModal } from "@/components/Books/reminders/TargetPickerModal";
import { AppChip } from "@/components/ui/AppChip";
import { WEEKDAYS } from "@/constants/weekdays";

type Props = {
  owner: ReminderOwner;
  mode: "new" | "edit";
  reminderId?: string;
};

export function ReminderEditorScreen({ owner, mode, reminderId }: Props) {
  const theme = useTheme();
  const { colors } = theme;

  const cardBg = colors.surface;
  const innerBg = colors.surfaceElevated;
  const border = colors.borderSubtle;

  const text = colors.textPrimary;
  const text2 = colors.textSecondary;
  const textInverse = colors.textInverse;

  const primaryBg = colors.primary;
  const danger = colors.danger;

  const chipColors = useMemo(
    () => ({
      active: {
        bg: primaryBg,
        border: primaryBg,
        text: textInverse,
        icon: textInverse,
      },
      inactive: {
        bg: innerBg,
        border,
        text,
        icon: text2,
      },
    }),
    [primaryBg, innerBg, border, text, text2, textInverse]
  );

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

  const initialBookName =
    initial.target.type === "book"
      ? (initial.target as any).bookName ?? ""
      : "";
  const initialBookUri =
    initial.target.type === "book" ? (initial.target as any).bookUri ?? "" : "";

  const [bookName, setBookName] = useState(initialBookName);
  const [bookUri, setBookUri] = useState(initialBookUri);
  const [bookPickerOpen, setBookPickerOpen] = useState(false);

  const initialPlanId =
    initial.target.type === "plan" ? (initial.target as any).planId ?? "" : "";
  const [planId, setPlanId] = useState(initialPlanId);
  const [planTitle, setPlanTitle] = useState(
    initial.target.type === "plan"
      ? (initial.target as any).planTitle ?? ""
      : ""
  );
  const [planPickerOpen, setPlanPickerOpen] = useState(false);

  const initialTargetId =
    initial.target.type === "target"
      ? (initial.target as any).targetId ?? ""
      : "";
  const [targetId, setTargetId] = useState(initialTargetId);
  const [targetTitle, setTargetTitle] = useState(
    initial.target.type === "target"
      ? (initial.target as any).targetTitle ?? ""
      : ""
  );
  const [targetPickerOpen, setTargetPickerOpen] = useState(false);

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
    if (targetType === "plan") {
      return { type: "plan", planId: (planId ?? "").trim(), planTitle };
    }

    if (targetType === "book") {
      return {
        type: "book",
        bookUri: (bookUri ?? "").trim(),
        bookName: (bookName ?? "").trim(),
      };
    }

    if (targetType === "target") {
      return { type: "target", targetId: (targetId ?? "").trim(), targetTitle };
    }

    if (targetType === "weeklyReport") return { type: "weeklyReport" };
    return { type: "general" };
  }, [targetType, planId, planTitle, bookUri, bookName, targetId, targetTitle]);

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
    if (targetType === "book" && (!bookUri || !bookName)) return;
    if (targetType === "plan" && !planId) return;
    if (targetType === "target" && !targetId) return;

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

  const chosenBookLabel = bookName && bookUri ? bookName : "Choose book";
  const chosenPlanLabel = planTitle
    ? planTitle
    : planId
    ? planId
    : "Choose plan";
  const chosenTargetLabel = targetTitle
    ? targetTitle
    : targetId
    ? targetId
    : "Choose target";

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
            <AppChip
              active={targetType === "general"}
              label="General"
              icon="notifications-outline"
              onPress={() => setTargetType("general")}
              colors={chipColors}
              size="md"
              pill={false}
            />
            <AppChip
              active={targetType === "plan"}
              label="Plan"
              icon="calendar-outline"
              onPress={() => setTargetType("plan")}
              colors={chipColors}
              size="md"
              pill={false}
            />
            <AppChip
              active={targetType === "book"}
              label="Book"
              icon="book-outline"
              onPress={() => setTargetType("book")}
              colors={chipColors}
              size="md"
              pill={false}
            />
            <AppChip
              active={targetType === "target"}
              label="Target"
              icon="flag-outline"
              onPress={() => setTargetType("target")}
              colors={chipColors}
              size="md"
              pill={false}
            />
            <AppChip
              active={targetType === "weeklyReport"}
              label="Haftalık Rapor"
              icon="stats-chart-outline"
              onPress={() => setTargetType("weeklyReport")}
              colors={chipColors}
              size="md"
              pill={false}
            />
          </View>

          {targetType === "book" ? (
            <View style={{ marginTop: spacing.md }}>
              <RowAction
                label="Book"
                value={chosenBookLabel}
                icon="book-outline"
                onPress={() => setBookPickerOpen(true)}
              />
              {bookName && bookUri ? (
                <MText
                  style={{ marginTop: spacing.sm, color: text2, opacity: 0.85 }}
                  numberOfLines={1}
                >
                  {bookUri}
                </MText>
              ) : (
                <MText style={{ marginTop: spacing.sm, color: text2 }}>
                  Select a book from your library.
                </MText>
              )}
            </View>
          ) : null}

          {targetType === "plan" ? (
            <View style={{ marginTop: spacing.md }}>
              <RowAction
                label="Plan"
                value={chosenPlanLabel}
                icon="calendar-outline"
                onPress={() => setPlanPickerOpen(true)}
              />
              {!planId ? (
                <MText style={{ marginTop: spacing.sm, color: text2 }}>
                  Select a plan to open when tapping the notification.
                </MText>
              ) : null}
            </View>
          ) : null}

          {targetType === "target" ? (
            <View style={{ marginTop: spacing.md }}>
              <RowAction
                label="Target"
                value={chosenTargetLabel}
                icon="flag-outline"
                onPress={() => setTargetPickerOpen(true)}
              />
              {!targetId ? (
                <MText style={{ marginTop: spacing.sm, color: text2 }}>
                  Select a target to open when tapping the notification.
                </MText>
              ) : null}
            </View>
          ) : null}
        </View>

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
            <AppChip
              active={scheduleType === "daily"}
              label="Daily"
              icon="repeat-outline"
              onPress={() => setScheduleType("daily")}
              colors={chipColors}
              size="md"
              pill={false}
            />
            <AppChip
              active={scheduleType === "weekly"}
              label="Weekly"
              icon="calendar-outline"
              onPress={() => setScheduleType("weekly")}
              colors={chipColors}
              size="md"
              pill={false}
            />
            <AppChip
              active={scheduleType === "once"}
              label="Once"
              icon="time-outline"
              onPress={() => setScheduleType("once")}
              colors={chipColors}
              size="md"
              pill={false}
            />
          </View>

          {scheduleType === "weekly" ? (
            <View style={[styles.rowWrap, { marginTop: spacing.md }]}>
              {WEEKDAYS.map((d) => (
                <AppChip
                  key={d.value}
                  active={weekday === d.value}
                  label={d.label}
                  onPress={() => setWeekday(d.value)}
                  colors={chipColors}
                  size="sm"
                  pill={false}
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
              is24Hour={true}
              value={new Date(2000, 0, 1, hour, minute)}
              onChange={onTimeChange}
            />
          ) : null}
        </View>

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
              iconBackgroundColor="rgba(255,255,255,0.16)"
              color={textInverse}
              labelColor={textInverse}
              style={[styles.actionTile, { borderColor: "transparent" }]}
            />
          </View>
        </View>
      </ScrollView>

      <BookPickerModal
        visible={bookPickerOpen}
        onClose={() => setBookPickerOpen(false)}
        selectedUri={bookUri}
        onPick={(b) => {
          setBookUri(b.uri);
          setBookName(b.name);
          setBookPickerOpen(false);
        }}
      />

      <PlanPickerModal
        visible={planPickerOpen}
        onClose={() => setPlanPickerOpen(false)}
        selectedId={planId}
        onPick={(p) => {
          setPlanId(p.id);
          setPlanTitle(p.title);
          setPlanPickerOpen(false);
        }}
      />

      <TargetPickerModal
        visible={targetPickerOpen}
        onClose={() => setTargetPickerOpen(false)}
        selectedId={targetId}
        onPick={(t) => {
          setTargetId(t.id);
          setTargetTitle(t.title);
          setTargetPickerOpen(false);
        }}
      />
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

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
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
