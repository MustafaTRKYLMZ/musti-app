import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import dayjs from "dayjs";
import { pad2, type MEvent, type EventCreate } from "@musti/planner";
import {
  MText,
  spacing,
  radii,
  useTheme,
  IconButton,
  iconSizes,
} from "@musti/ui-native";
import { AppModal } from "../AppModal";

export type EventCreateModalProps = {
  visible: boolean;
  day: Date;
  startMinute?: number;
  timezone?: string;
  locale?: string;
  onClose: () => void;
  onSubmit: (e: Omit<MEvent, "id">) => void;
};

function minuteToHHmm(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  return `${pad2(h)}:${pad2(m)}`;
}

function parseHHmm(s: string): { h: number; m: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(mm)) return null;
  if (h < 0 || h > 23) return null;
  if (mm < 0 || mm > 59) return null;
  return { h, m: mm };
}

function clampTimeOrder(start: string, end: string) {
  const s = parseHHmm(start);
  const e = parseHHmm(end);
  if (!s || !e) return { start, end };

  const sMin = s.h * 60 + s.m;
  const eMin = e.h * 60 + e.m;

  if (eMin <= sMin) {
    return { start, end: minuteToHHmm(Math.min(24 * 60 - 1, sMin + 30)) };
  }
  return { start, end };
}

export const EventCreateModal = ({
  visible,
  day,
  startMinute,
  timezone,
  locale,
  onClose,
  onSubmit,
}: EventCreateModalProps) => {
  const { colors } = useTheme();

  const surface =
    (colors as any).surface ??
    (colors as any).backgroundSecondary ??
    colors.background;

  const title = useMemo(() => {
    return day.toLocaleDateString(locale ?? "en-EN", {
      day: "numeric",
      month: "long",
      weekday: "long",
    });
  }, [day, locale]);

  const defaultStart = useMemo(() => {
    const m = startMinute ?? 9 * 60;
    const snapped = Math.round(m / 15) * 15;
    return minuteToHHmm(Math.max(0, Math.min(23 * 60 + 59, snapped)));
  }, [startMinute]);

  const defaultEnd = useMemo(() => {
    const s = parseHHmm(defaultStart);
    if (!s) return "10:00";
    return minuteToHHmm(Math.min(23 * 60 + 59, s.h * 60 + s.m + 60));
  }, [defaultStart]);

  const [draft, setDraft] = useState<EventCreate>(() => ({
    title: "",
    allDay: false,
    startTime: defaultStart,
    endTime: defaultEnd,
    color: undefined,
    location: "",
    notes: "",
  }));

  useEffect(() => {
    if (!visible) return;
    setDraft({
      title: "",
      allDay: false,
      startTime: defaultStart,
      endTime: defaultEnd,
      color: undefined,
      location: "",
      notes: "",
    });
  }, [visible, defaultStart, defaultEnd]);

  const canSave = useMemo(() => {
    if (!draft.title.trim()) return false;
    if (draft.allDay) return true;

    const s = parseHHmm(draft.startTime);
    const e = parseHHmm(draft.endTime);
    if (!s || !e) return false;

    return e.h * 60 + e.m > s.h * 60 + s.m;
  }, [draft]);

  const submit = useCallback(() => {
    if (!canSave) return;

    const cleanTitle = draft.title.trim();

    if (draft.allDay) {
      const start = dayjs(day).startOf("day").toISOString();
      const end = dayjs(day).add(1, "day").startOf("day").toISOString();

      onSubmit({
        title: cleanTitle,
        start,
        end,
        timezone,
        allDay: true,
        color: draft.color,
        location: draft.location?.trim() || undefined,
        notes: draft.notes?.trim() || undefined,
        source: "planner",
      });

      onClose();
      return;
    }

    const s = parseHHmm(draft.startTime)!;
    const e = parseHHmm(draft.endTime)!;

    const start = dayjs(day)
      .hour(s.h)
      .minute(s.m)
      .second(0)
      .millisecond(0)
      .toISOString();
    const end = dayjs(day)
      .hour(e.h)
      .minute(e.m)
      .second(0)
      .millisecond(0)
      .toISOString();

    onSubmit({
      title: cleanTitle,
      start,
      end,
      timezone,
      allDay: false,
      color: draft.color,
      location: draft.location?.trim() || undefined,
      notes: draft.notes?.trim() || undefined,
      source: "planner",
    });

    onClose();
  }, [canSave, draft, day, onClose, onSubmit, timezone]);

  const toggleAllDay = useCallback(() => {
    setDraft((d) => {
      const next = { ...d, allDay: !d.allDay };

      if (!next.allDay) {
        const fixed = clampTimeOrder(next.startTime, next.endTime);
        return { ...next, ...fixed };
      }
      return next;
    });
  }, []);

  return (
    <AppModal
      visible={visible}
      title={title}
      onClose={onClose}
      variant="full"
      actions={{
        onCancel: onClose,
        onSave: submit,
        saveDisabled: !canSave,
        cancelLabel: "Cancel",
        saveLabel: "Save",
      }}
    >
      {/* Title */}
      <View style={styles.field}>
        <MText variant="label" color="textSecondary">
          Title
        </MText>
        <TextInput
          value={draft.title}
          onChangeText={(t) => setDraft((d) => ({ ...d, title: t }))}
          placeholder="Add title"
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            {
              borderColor: colors.borderSubtle,
              backgroundColor: surface,
              color: colors.textPrimary,
            },
          ]}
          autoFocus
          returnKeyType="done"
        />
      </View>

      {/* All day */}
      <Pressable
        onPress={toggleAllDay}
        style={[
          styles.toggleRow,
          { borderColor: colors.borderSubtle, backgroundColor: surface },
        ]}
      >
        <MText variant="bodyStrong" color="textPrimary">
          All day
        </MText>

        <IconButton
          name={draft.allDay ? "checkmark-circle-outline" : "ellipse-outline"}
          size={iconSizes.lg}
          onPress={toggleAllDay}
          style={{ padding: spacing.xs }}
          accessibilityLabel="Toggle all-day"
        />
      </Pressable>

      {/* Times */}
      {!draft.allDay && (
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <MText variant="label" color="textSecondary">
              Start
            </MText>
            <TextInput
              value={draft.startTime}
              onChangeText={(t) => {
                setDraft((d) => {
                  const next = { ...d, startTime: t };
                  const fixed = clampTimeOrder(next.startTime, next.endTime);
                  return { ...next, ...fixed };
                });
              }}
              placeholder="HH:mm"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  borderColor: colors.borderSubtle,
                  backgroundColor: surface,
                  color: colors.textPrimary,
                },
              ]}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <View style={{ width: spacing.md }} />

          <View style={{ flex: 1 }}>
            <MText variant="label" color="textSecondary">
              End
            </MText>
            <TextInput
              value={draft.endTime}
              onChangeText={(t) => {
                setDraft((d) => {
                  const next = { ...d, endTime: t };
                  const fixed = clampTimeOrder(next.startTime, next.endTime);
                  return { ...next, ...fixed };
                });
              }}
              placeholder="HH:mm"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  borderColor: colors.borderSubtle,
                  backgroundColor: surface,
                  color: colors.textPrimary,
                },
              ]}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>
      )}

      {/* Location */}
      <View style={styles.field}>
        <MText variant="label" color="textSecondary">
          Location
        </MText>
        <TextInput
          value={draft.location ?? ""}
          onChangeText={(t) => setDraft((d) => ({ ...d, location: t }))}
          placeholder="Add location"
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            {
              borderColor: colors.borderSubtle,
              backgroundColor: surface,
              color: colors.textPrimary,
            },
          ]}
        />
      </View>

      {/* Notes */}
      <View style={styles.field}>
        <MText variant="label" color="textSecondary">
          Notes
        </MText>
        <TextInput
          value={draft.notes ?? ""}
          onChangeText={(t) => setDraft((d) => ({ ...d, notes: t }))}
          placeholder="Add notes"
          placeholderTextColor={colors.textSecondary}
          multiline
          style={[
            styles.input,
            styles.notes,
            {
              borderColor: colors.borderSubtle,
              backgroundColor: surface,
              color: colors.textPrimary,
            },
          ]}
        />
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  field: { marginBottom: spacing.md, gap: spacing.xs },

  row2: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  input: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  notes: {
    height: 110,
    textAlignVertical: "top",
  },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
  },
});
