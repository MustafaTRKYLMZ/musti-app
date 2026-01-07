import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { BaseIcon, MText, radii, spacing, useTheme } from "@musti/ui-native";

function hhmmToDate(hhmm: string) {
  const [h, m] = (hhmm || "00:00").split(":").map(Number);
  const d = new Date();
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

function dateToHHmm(d: Date) {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

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
    //   borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: "center",
    minHeight: 44,
  },
});
