import React, { memo, useCallback, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import {
  MText,
  spacing,
  radii,
  useTheme,
  iconSizes,
  IconButton,
  ThemeColors,
} from "@musti/ui-native";

type Props = {
  value: Date;
  onChange: (next: Date) => void;
};

export const DateField = memo(function DateField({ value, onChange }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const surface =
    (colors as ThemeColors).surface ??
    (colors as ThemeColors).backgroundSecondary ??
    colors.background;

  const formatted = useMemo(() => {
    try {
      // ✅ Wed, Jan 7
      return value.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return value.toDateString();
    }
  }, [value]);

  const openPicker = useCallback(() => setOpen(true), []);
  const closePicker = useCallback(() => setOpen(false), []);

  const onPickerChange = useCallback(
    (e: DateTimePickerEvent, d?: Date) => {
      if (Platform.OS === "android") closePicker();
      if (e.type === "dismissed") return;
      if (!d) return;

      // ✅ sadece date kısmı
      const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      onChange(dd);
    },
    [closePicker, onChange]
  );

  return (
    <View>
      <Pressable
        onPress={openPicker}
        style={[
          styles.row,
          { borderColor: colors.borderSubtle, backgroundColor: surface },
        ]}
      >
        <MText variant="body" color="textPrimary">
          {formatted}
        </MText>

        <View style={{ flex: 1 }} />
      </Pressable>

      {open ? (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onPickerChange}
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    // borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
});
