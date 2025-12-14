import React, { useMemo, useState } from "react";
import { View, StyleSheet, Pressable, Switch, Platform } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Toast from "react-native-root-toast";
import { MText, spacing, radii, useTheme } from "@budget/ui-native";

type Props = {
  title: string;
  description?: string;
  enabled: boolean;
  hour: number;
  minute: number;
  onToggle: (v: boolean) => Promise<void> | void;
  onTimeChange: (hour: number, minute: number) => Promise<void> | void;
};

export function NotificationReminderSection({
  title,
  description,
  enabled,
  hour,
  minute,
  onToggle,
  onTimeChange,
}: Props) {
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const timeLabel = useMemo(() => {
    const hh = String(hour).padStart(2, "0");
    const mm = String(minute).padStart(2, "0");
    return `${hh}:${mm}`;
  }, [hour, minute]);

  const onChange = async (e: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS !== "ios") setShowPicker(false);
    if (e.type !== "set" || !date) return;

    try {
      await onTimeChange(date.getHours(), date.getMinutes());
    } catch {
      Toast.show("Time could not be updated.", {
        duration: Toast.durations.SHORT,
      });
    }
  };

  const openPicker = () => {
    if (!enabled) {
      Toast.show("Enable notifications first.", {
        duration: Toast.durations.SHORT,
      });
      return;
    }
    setShowPicker(true);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <MText variant="heading3">{title}</MText>
          {description ? (
            <MText style={{ marginTop: 4, color: colors.textSecondary }}>
              {description}
            </MText>
          ) : null}
        </View>

        <Switch
          value={enabled}
          onValueChange={async (v) => {
            try {
              await onToggle(v);
            } catch {
              Toast.show("Notification settings could not be updated.", {
                duration: Toast.durations.SHORT,
              });
            }
          }}
        />
      </View>

      <View style={[styles.row, { marginTop: spacing.md }]}>
        <MText style={{ color: colors.textSecondary }}>Time</MText>

        <Pressable
          onPress={openPicker}
          style={[
            styles.timePill,
            {
              backgroundColor: colors.surface,
              opacity: enabled ? 1 : 0.5,
            },
          ]}
        >
          <MText
            style={{
              color: enabled ? colors.textPrimary : colors.textSecondary,
            }}
          >
            {timeLabel}
          </MText>
        </Pressable>
      </View>

      {showPicker ? (
        <DateTimePicker
          mode="time"
          value={new Date(2000, 0, 1, hour, minute)}
          onChange={onChange}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minuteInterval={5}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radii.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  timePill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
  },
});
