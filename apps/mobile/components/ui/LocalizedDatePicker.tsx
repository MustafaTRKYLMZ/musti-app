import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import dayjs from "dayjs";
import { getLocalizedDateParts, useTranslation } from "@budget/core";
import { MText, colors, spacing, radii } from "@budget/ui-native";
import { BaseIcon } from "@/components/ui/AppIcon";

interface Props {
  value: string; // "YYYY-MM-DD"
  label?: string;
  onChange: (dateStr: string) => void;
}

export function LocalizedDatePicker({ value, label, onChange }: Props) {
  const [isOpen, setOpen] = useState(false);
  const { language, t } = useTranslation();

  const { day, monthShort, year } = getLocalizedDateParts(value, language);

  return (
    <>
      {label && (
        <View style={styles.labelWrapper}>
          <MText variant="caption" color="textSecondary">
            {label}
          </MText>
        </View>
      )}

      {/* MAIN BUTTON */}
      <TouchableOpacity style={styles.button} onPress={() => setOpen(true)}>
        <View style={styles.iconWrapper}>
          <BaseIcon
            name="calendar-outline"
            size={18}
            color={colors.textMuted}
          />
        </View>
        <MText variant="bodyStrong" color="textPrimary">
          {day} {monthShort} {year}
        </MText>
      </TouchableOpacity>

      {/* CUSTOM HEADER + PICKER */}
      <Modal visible={isOpen} transparent animationType="fade">
        {/* BACKDROP */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        />

        {/* BOTTOM SHEET */}
        <View style={styles.sheet}>
          <DateTimePickerModal
            isVisible={true}
            themeVariant="dark"
            date={dayjs(value).toDate()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onCancel={() => setOpen(false)}
            onConfirm={(d) => {
              onChange(dayjs(d).format("YYYY-MM-DD"));
              setOpen(false);
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  labelWrapper: {
    marginBottom: spacing.xs,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  iconWrapper: {
    marginRight: 6,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdropStrong,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surfaceStrong,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: "center",
  },
});
