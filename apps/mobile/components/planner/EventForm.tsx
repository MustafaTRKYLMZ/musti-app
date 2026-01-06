import React, { memo, useMemo } from "react";
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
} from "@musti/ui-native";

type EventFormProps = {
  control: Control<EventCreate>;
  errors: FieldErrors<EventCreate>;
  allDay: boolean;
  onToggleAllDay: () => void;

  // ✅ NEW
  colorValue?: string;
  onOpenColor: () => void;
};

export const EventForm = memo(function EventForm({
  control,
  errors,
  allDay,
  onToggleAllDay,
  colorValue,
  onOpenColor,
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
        borderColor: colors.borderSubtle,
        backgroundColor: surface,
        color: colors.textPrimary,
      },
    ],
    [colors, surface]
  );

  return (
    <View>
      <View style={styles.field}>
        <MText variant="label" color="textSecondary">
          Title
        </MText>

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
              style={inputBase}
              autoFocus
              returnKeyType="done"
            />
          )}
        />

        {!!errors.title && (
          <MText variant="caption" style={{ color: colors.danger }}>
            Title is required
          </MText>
        )}
      </View>

      <Pressable
        onPress={onToggleAllDay}
        style={[
          styles.toggleRow,
          { borderColor: colors.borderSubtle, backgroundColor: surface },
        ]}
      >
        <MText variant="bodyStrong" color="textPrimary">
          All day
        </MText>

        <IconButton
          name={allDay ? "checkmark-circle-outline" : "ellipse-outline"}
          size={iconSizes.lg}
          onPress={onToggleAllDay}
          style={{ padding: spacing.xs }}
          accessibilityLabel="Toggle all-day"
        />
      </Pressable>

      {!allDay && (
        <View style={styles.row2}>
          <View style={{ flex: 1 }}>
            <MText variant="label" color="textSecondary">
              Start
            </MText>

            <Controller
              control={control}
              name="startTime"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="HH:mm"
                  placeholderTextColor={colors.textSecondary}
                  style={inputBase}
                  keyboardType="numbers-and-punctuation"
                />
              )}
            />
          </View>

          <View style={{ width: spacing.md }} />

          <View style={{ flex: 1 }}>
            <MText variant="label" color="textSecondary">
              End
            </MText>

            <Controller
              control={control}
              name="endTime"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="HH:mm"
                  placeholderTextColor={colors.textSecondary}
                  style={inputBase}
                  keyboardType="numbers-and-punctuation"
                />
              )}
            />
          </View>
        </View>
      )}

      <View style={styles.field}>
        <MText variant="label" color="textSecondary">
          Location
        </MText>

        <Controller
          control={control}
          name="location"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value ?? ""}
              onChangeText={onChange}
              placeholder="Add location"
              placeholderTextColor={colors.textSecondary}
              style={inputBase}
            />
          )}
        />
      </View>

      <View style={styles.field}>
        <MText variant="label" color="textSecondary">
          Notes
        </MText>

        <Controller
          control={control}
          name="notes"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value ?? ""}
              onChangeText={onChange}
              placeholder="Add notes"
              placeholderTextColor={colors.textSecondary}
              multiline
              style={[inputBase, styles.notes]}
            />
          )}
        />
      </View>

      {/* ✅ Color picker row (opens modal) */}
      <View style={styles.field}>
        <MText variant="label" color="textSecondary">
          Color
        </MText>

        <Controller
          control={control}
          name="color"
          render={() => (
            <Pressable
              onPress={onOpenColor}
              style={[
                styles.colorPickRow,
                { borderColor: colors.borderSubtle, backgroundColor: surface },
              ]}
            >
              <View style={styles.colorLeft}>
                <View
                  style={[
                    styles.colorPreview,
                    {
                      backgroundColor: colorValue ?? "transparent",
                      borderColor: colorValue
                        ? "transparent"
                        : colors.borderSubtle,
                    },
                  ]}
                />
                <MText variant="body" color="textSecondary">
                  {colorValue ? colorValue : "Default"}
                </MText>
              </View>

              <IconButton
                name="chevron-forward-outline"
                size={iconSizes.md}
                onPress={onOpenColor}
                style={{ padding: spacing.xs }}
                accessibilityLabel="Pick color"
              />
            </Pressable>
          )}
        />
      </View>
    </View>
  );
});

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
  notes: { height: 110, textAlignVertical: "top" },
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

  // color row
  colorPickRow: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  colorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  colorPreview: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
  },
});
