import React, { useMemo, useState } from "react";
import { View, StyleSheet, Switch, Platform } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Toast from "react-native-root-toast";
import { MText, spacing, radii, useTheme, touchTargets } from "@musti/ui-native";
import { useTranslation } from "@musti/core";
import { RowAction } from "@/components/ui/RowAction";
import { bookshelfScreenStyles } from "@/components/Books/bookshelfScreenStyles";

type Props = {
  title: string;
  description?: string;
  enabled: boolean;
  hour: number;
  minute: number;
  onToggle: (v: boolean) => Promise<void> | void;
  onTimeChange: (hour: number, minute: number) => Promise<void> | void;
  variant?: "card" | "embedded";
};

export function NotificationReminderSection({
  title,
  description,
  enabled,
  hour,
  minute,
  onToggle,
  onTimeChange,
  variant = "card",
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
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
      Toast.show(t("bookshelf.notifications.timeUpdateFailed"), {
        duration: Toast.durations.SHORT,
      });
    }
  };

  const openPicker = () => {
    if (!enabled) {
      Toast.show(t("bookshelf.notifications.enableFirst"), {
        duration: Toast.durations.SHORT,
      });
      return;
    }
    setShowPicker(true);
  };

  const wrapStyle =
    variant === "embedded"
      ? styles.embedded
      : [bookshelfScreenStyles.sectionCard, styles.cardStandalone];

  return (
    <View style={wrapStyle}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <MText variant="heading4" color="textPrimary">
            {title}
          </MText>
          {description ? (
            <MText variant="caption" color="textSecondary" style={styles.desc}>
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
              Toast.show(t("bookshelf.notifications.updateFailed"), {
                duration: Toast.durations.SHORT,
              });
            }
          }}
        />
      </View>

      <RowAction
        label={t("bookshelf.reminders.timeLabel")}
        value={timeLabel}
        icon="time-outline"
        onPress={openPicker}
      />

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
  cardStandalone: {
    backgroundColor: undefined,
  },
  embedded: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    minHeight: touchTargets.minimum,
  },
  desc: {
    marginTop: spacing.xs,
  },
});
