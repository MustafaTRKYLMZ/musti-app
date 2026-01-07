import React, { memo, useMemo, useState, useCallback } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import type { EventCreate } from "@musti/planner";
import {
  MText,
  spacing,
  radii,
  useTheme,
  IconButton,
  iconSizes,
  ThemeColors,
  BaseIcon,
  Divider,
  sizes,
} from "@musti/ui-native";
import { TimeField } from "./TimeField";
import { DateField } from "./DateField";

type EventFormProps = {
  control: Control<EventCreate>;
  errors: FieldErrors<EventCreate>;

  allDay: boolean;
  onToggleAllDay: () => void;

  startDay: Date;
  endDay: Date;
  onChangeStartDay: (d: Date) => void;
  onChangeEndDay: (d: Date) => void;

  color?: string;
  onOpenColors: () => void;
};

export const EventForm = memo(function EventForm({
  control,
  errors,
  allDay,
  onToggleAllDay,

  startDay,
  endDay,
  onChangeStartDay,
  onChangeEndDay,

  color,
  onOpenColors,
}: EventFormProps) {
  const { colors } = useTheme();

  const surface =
    (colors as ThemeColors).surface ??
    (colors as ThemeColors).backgroundSecondary ??
    colors.background;

  const inputBase = useMemo(
    () => [
      styles.input,
      {
        backgroundColor: surface,
        color: colors.textPrimary,
      },
    ],
    [colors, surface]
  );

  const [startLabelH, setStartLabelH] = useState(0);
  const [startStackH, setStartStackH] = useState(0);

  const onStartLabelLayout = useCallback(
    (e: any) => setStartLabelH(e?.nativeEvent?.layout?.height ?? 0),
    []
  );
  const onStartStackLayout = useCallback(
    (e: any) => setStartStackH(e?.nativeEvent?.layout?.height ?? 0),
    []
  );

  const arrowSize = iconSizes.md ?? 16;
  const arrowOffsetX = spacing.sm;
  const arrowTop = Math.max(0, startLabelH + startStackH / 2 - arrowSize / 2);

  return (
    <View style={styles.form}>
      <View style={styles.field}>
        <View style={[styles.rowBox, { backgroundColor: surface }]}>
          <View style={styles.rowIcon}>
            <BaseIcon
              name="text-outline"
              size={sizes["2xl"]}
              color={colors.textSecondary}
            />
          </View>

          <Controller
            control={control}
            name="title"
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Add title"
                placeholderTextColor={colors.textSecondary}
                style={[inputBase, styles.rowInput, styles.titleInput]}
                autoFocus
              />
            )}
          />

          <View style={styles.headerRight}>
            <Pressable onPress={onOpenColors} hitSlop={8}>
              <View
                style={[
                  styles.colorDot,
                  {
                    backgroundColor: color ?? "transparent",
                    borderColor: color ? "transparent" : colors.borderSubtle,
                  },
                ]}
              />
            </Pressable>

            <IconButton
              name="color-palette-outline"
              size={iconSizes.md}
              onPress={onOpenColors}
              style={{ padding: 4 }}
            />
          </View>
        </View>

        {!!errors.title && (
          <MText variant="caption" style={{ color: colors.danger }}>
            Title is required
          </MText>
        )}
      </View>

      <Divider inset={spacing.lg} thickness={1} />

      <View style={styles.field}>
        <Pressable
          onPress={onToggleAllDay}
          style={[styles.rowBox, { backgroundColor: surface }]}
        >
          <View style={styles.rowIcon}>
            <BaseIcon
              name="calendar-outline"
              size={18}
              color={colors.textSecondary}
            />
          </View>

          <MText variant="bodyStrong" style={{ flex: 1 }}>
            All day
          </MText>

          <IconButton
            name={allDay ? "checkmark-circle-outline" : "ellipse-outline"}
            size={iconSizes.md}
            onPress={onToggleAllDay}
            style={{ padding: 4 }}
          />
        </Pressable>
      </View>

      <View style={styles.twoColWrap}>
        <View style={styles.twoColRow}>
          <View style={styles.col}>
            <MText
              variant="label"
              color="textSecondary"
              onLayout={onStartLabelLayout}
            >
              Start
            </MText>

            <View onLayout={onStartStackLayout} style={styles.stack}>
              <DateField value={startDay} onChange={onChangeStartDay} />

              {!allDay && (
                <Controller
                  control={control}
                  name="startTime"
                  render={({ field }) => (
                    <TimeField value={field.value} onChange={field.onChange} />
                  )}
                />
              )}
            </View>
          </View>

          <View style={styles.col}>
            <MText variant="label" color="textSecondary">
              End
            </MText>

            <View style={styles.stack}>
              <DateField value={endDay} onChange={onChangeEndDay} />

              {!allDay && (
                <Controller
                  control={control}
                  name="endTime"
                  render={({ field }) => (
                    <TimeField value={field.value} onChange={field.onChange} />
                  )}
                />
              )}
            </View>
          </View>
        </View>

        {!allDay && (
          <View pointerEvents="none" style={styles.arrowOverlay}>
            <View
              pointerEvents="none"
              style={[
                styles.arrowInner,
                {
                  top: arrowTop,
                  left: "50%",
                  marginLeft: -(arrowSize / 2),
                  transform: [{ translateX: -arrowOffsetX }],
                },
              ]}
            >
              <BaseIcon
                name="arrow-forward-outline"
                size={arrowSize}
                color={colors.textSecondary}
              />
            </View>
          </View>
        )}
      </View>

      <Divider inset={spacing.lg} thickness={1} />

      <View style={styles.field}>
        <View style={[styles.rowBox, { backgroundColor: surface }]}>
          <View style={styles.rowIcon}>
            <BaseIcon
              name="location-outline"
              size={18}
              color={colors.textSecondary}
            />
          </View>

          <Controller
            control={control}
            name="location"
            render={({ field }) => (
              <TextInput
                value={field.value ?? ""}
                onChangeText={field.onChange}
                placeholder="Add location"
                placeholderTextColor={colors.textSecondary}
                style={[inputBase, styles.rowInput]}
              />
            )}
          />
        </View>
      </View>

      <Divider inset={spacing.lg} thickness={1} />

      <View style={styles.field}>
        <View
          style={[
            styles.rowBox,
            styles.notesRowBox,
            { backgroundColor: surface },
          ]}
        >
          <View style={[styles.rowIcon, styles.rowIconTop]}>
            <BaseIcon
              name="document-text-outline"
              size={18}
              color={colors.textSecondary}
            />
          </View>

          <Controller
            control={control}
            name="notes"
            render={({ field }) => (
              <TextInput
                value={field.value ?? ""}
                onChangeText={field.onChange}
                placeholder="Add notes"
                placeholderTextColor={colors.textSecondary}
                multiline
                style={[inputBase, styles.rowInput, styles.notes]}
              />
            )}
          />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  form: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  field: {},

  rowBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },

  rowIcon: {
    width: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  rowIconTop: {
    alignSelf: "flex-start",
    marginTop: 4,
  },

  rowInput: {
    flex: 1,
    paddingVertical: 2,
    paddingHorizontal: 0,
    fontSize: 15,
    lineHeight: 18,
  },

  titleInput: {
    fontSize: 16,
    lineHeight: 20,
  },

  input: {
    borderWidth: 0,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 1,
  },

  notesRowBox: {
    alignItems: "flex-start",
  },

  notes: {
    height: 96,
    paddingTop: 4,
    textAlignVertical: "top",
  },

  twoColWrap: {
    position: "relative",
    marginVertical: spacing.sm,
  },

  twoColRow: {
    flexDirection: "row",
    gap: spacing.lg,
    overflow: "visible",
  },

  col: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
    zIndex: 1,
  },

  stack: {
    gap: spacing.sm,
  },

  arrowOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none",
    zIndex: -1,
  },

  arrowInner: {
    position: "absolute",
    pointerEvents: "none",
  },
});
