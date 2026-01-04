// components/Repeat/RepeatEditor.tsx
import React from "react";
import { View, StyleSheet, Pressable, TextInput, Platform } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { MText, spacing, radii, useTheme } from "/ui-native";
import { AppChip } from "@/components/ui/AppChip";
import type { TargetRepeat } from "/core";
import { WEEKDAYS } from "@/constants/weekdays";
import { isValidTimeOfDay, normalizeTimeOfDay } from "/forms";

export type RepeatEndKind = "never" | "until" | "count";

type ChipColors = {
  active: { bg: string; border: string; text: string; icon: string };
  inactive: { bg: string; border: string; text: string; icon: string };
};

type RepeatEditorProps = {
  sectionTitleStyle: any;
  chipColors: ChipColors;

  repeatEnabled: boolean;
  onToggleEnabled: () => void;

  repeatFreq: TargetRepeat["freq"];
  onChangeFreq: (v: TargetRepeat["freq"]) => void;

  repeatInterval: string;
  onChangeInterval: (v: string) => void;

  selectedWeekdays: number[];
  onToggleWeekday: (value: number) => void;

  repeatTimeOfDay: string;
  onChangeTimeOfDay: (v: string) => void;

  endKind: RepeatEndKind;
  onChangeEndKind: (v: RepeatEndKind) => void;

  untilDate: Date;
  onChangeUntilDate: (d: Date) => void;

  countRemaining: string;
  onChangeCountRemaining: (v: string) => void;

  showUntilPicker: boolean;
  onSetShowUntilPicker: (v: boolean) => void;
};

export const RepeatEditor = ({
  sectionTitleStyle,
  chipColors,

  repeatEnabled,
  onToggleEnabled,

  repeatFreq,
  onChangeFreq,

  repeatInterval,
  onChangeInterval,

  selectedWeekdays,
  onToggleWeekday,

  repeatTimeOfDay,
  onChangeTimeOfDay,

  endKind,
  onChangeEndKind,

  untilDate,
  onChangeUntilDate,

  countRemaining,
  onChangeCountRemaining,

  showUntilPicker,
  onSetShowUntilPicker,
}: RepeatEditorProps) => {
  const { colors } = useTheme();
  const untilLabel = dayjs(untilDate).format("D MMM YYYY");

  const onUntilPicked = (_e: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS !== "ios") onSetShowUntilPicker(false);
    if (d) onChangeUntilDate(d);
  };

  return (
    <>
      <MText style={sectionTitleStyle} color="textSecondary">
        Repeat
      </MText>

      <View style={styles.chipsRow}>
        <AppChip
          label={repeatEnabled ? "On" : "Off"}
          icon="repeat-outline"
          active={repeatEnabled}
          onPress={onToggleEnabled}
          colors={chipColors}
          size="md"
          pill={false}
        />
      </View>

      {repeatEnabled ? (
        <>
          <MText style={sectionTitleStyle} color="textSecondary">
            Frequency
          </MText>

          <View style={styles.chipsRow}>
            <AppChip
              label="Daily"
              icon="calendar-outline"
              active={repeatFreq === "daily"}
              onPress={() => onChangeFreq("daily")}
              colors={chipColors}
              size="md"
              pill={false}
            />
            <AppChip
              label="Weekly"
              icon="calendar-outline"
              active={repeatFreq === "weekly"}
              onPress={() => onChangeFreq("weekly")}
              colors={chipColors}
              size="md"
              pill={false}
            />
            <AppChip
              label="Monthly"
              icon="calendar-outline"
              active={repeatFreq === "monthly"}
              onPress={() => onChangeFreq("monthly")}
              colors={chipColors}
              size="md"
              pill={false}
            />
          </View>

          <MText style={sectionTitleStyle} color="textSecondary">
            Interval
          </MText>

          <TextInput
            value={repeatInterval}
            onChangeText={(t) => onChangeInterval(t.replace(/[^\d]/g, ""))}
            keyboardType="number-pad"
            placeholder="1"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceElevated ?? colors.surface,
                color: colors.textPrimary,
              },
            ]}
          />

          {repeatFreq === "weekly" ? (
            <>
              <MText style={sectionTitleStyle} color="textSecondary">
                Weekdays
              </MText>

              <View style={styles.weekdaysRow}>
                {WEEKDAYS.map((w) => {
                  const active = selectedWeekdays.includes(w.value);
                  return (
                    <Pressable
                      key={String(w.value)}
                      onPress={() => onToggleWeekday(w.value)}
                      style={[
                        styles.weekdayChip,
                        {
                          borderColor: colors.borderSubtle,
                          backgroundColor: active
                            ? colors.surfaceElevated
                            : colors.surface,
                        },
                      ]}
                    >
                      <MText
                        style={{
                          fontWeight: "900",
                          opacity: active ? 1 : 0.75,
                        }}
                      >
                        {w.label}
                      </MText>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          <MText style={sectionTitleStyle} color="textSecondary">
            Reset time (HH:mm)
          </MText>

          <TextInput
            value={repeatTimeOfDay}
            onChangeText={(t) => onChangeTimeOfDay(normalizeTimeOfDay(t))}
            placeholder="00:00"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceElevated ?? colors.surface,
                color: colors.textPrimary,
              },
            ]}
          />

          {!isValidTimeOfDay(repeatTimeOfDay) ? (
            <MText style={{ opacity: 0.7, marginTop: spacing.xs }}>
              Format: HH:mm (e.g. 08:30)
            </MText>
          ) : null}

          <MText style={sectionTitleStyle} color="textSecondary">
            End
          </MText>

          <View style={styles.chipsRow}>
            <AppChip
              label="Never"
              icon="infinite-outline"
              active={endKind === "never"}
              onPress={() => onChangeEndKind("never")}
              colors={chipColors}
              size="md"
              pill={false}
            />
            <AppChip
              label="Until"
              icon="calendar-outline"
              active={endKind === "until"}
              onPress={() => onChangeEndKind("until")}
              colors={chipColors}
              size="md"
              pill={false}
            />
            <AppChip
              label="Count"
              icon="repeat-outline"
              active={endKind === "count"}
              onPress={() => onChangeEndKind("count")}
              colors={chipColors}
              size="md"
              pill={false}
            />
          </View>

          {endKind === "until" ? (
            <View style={{ marginTop: spacing.sm }}>
              <Pressable
                onPress={() => onSetShowUntilPicker(true)}
                style={[
                  styles.smallBtn,
                  {
                    borderColor: colors.borderSubtle,
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <MText style={{ fontWeight: "900" }}>
                  End date: {untilLabel}
                </MText>
              </Pressable>

              {showUntilPicker ? (
                <DateTimePicker
                  value={untilDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onUntilPicked}
                />
              ) : null}
            </View>
          ) : null}

          {endKind === "count" ? (
            <View style={{ marginTop: spacing.sm }}>
              <TextInput
                value={countRemaining}
                onChangeText={(t) =>
                  onChangeCountRemaining(t.replace(/[^\d]/g, ""))
                }
                keyboardType="number-pad"
                placeholder="10"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.input,
                  {
                    borderColor: colors.borderSubtle,
                    backgroundColor: colors.surfaceElevated ?? colors.surface,
                    color: colors.textPrimary,
                  },
                ]}
              />
              <MText style={{ opacity: 0.7, marginTop: spacing.xs }}>
                How many cycles (e.g. 10).
              </MText>
            </View>
          ) : null}
        </>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
    alignItems: "center",
  },
  weekdaysRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
    alignItems: "center",
  },
  weekdayChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  smallBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
});
