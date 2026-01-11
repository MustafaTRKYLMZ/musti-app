import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MText, radii, spacing, useTheme } from "@musti/ui-native";
import { dateToHHmm } from "@musti/planner";
import { hhmmToDate } from "@/utils/calendar/format";

type Props = {
  value: string;
  onChange: (hhmm: string) => void;
};

export function TimeField({ value, onChange }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const pickerValue = useMemo(() => hhmmToDate(value), [value]);

  return (
    <View style={{ gap: spacing.xs }}>
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.box,
          {
            borderColor: colors.borderSubtle,
            backgroundColor: (colors as any).surface ?? colors.background,
          },
        ]}
      >
        <MText variant="body" color="textPrimary">
          {value}
        </MText>
      </Pressable>

      {open && (
        <DateTimePicker
          value={pickerValue}
          mode="time"
          is24Hour
          display="spinner"
          onChange={(event, date) => {
            if ((event as any)?.type === "dismissed") {
              setOpen(false);
              return;
            }
            setOpen(false);
            if (!date) return;

            onChange(dateToHHmm(date));
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: "center",
    minHeight: 44,
  },
});
