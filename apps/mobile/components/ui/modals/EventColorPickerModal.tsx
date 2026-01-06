import React, { memo, useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { MText, spacing, radii, useTheme, ThemeColors } from "@musti/ui-native";
import { AppModal } from "../AppModal";
import { DEFAULT_EVENT_COLORS } from "@/config/defaultEvetColors";

type Props = {
  visible: boolean;
  value?: string;
  onClose: () => void;
  onSelect: (color?: string) => void;
  colors?: string[];
};

export const EventColorPickerModal = memo(function EventColorPickerModal({
  visible,
  value,
  onClose,
  onSelect,
  colors,
}: Props) {
  const { colors: themeColors } = useTheme();

  const surface =
    (themeColors as ThemeColors).surface ??
    (themeColors as ThemeColors).backgroundSecondary ??
    themeColors.background;

  const palette = colors?.length ? colors : DEFAULT_EVENT_COLORS;

  const isSelected = useMemo(() => new Set([value]), [value]);

  return (
    <AppModal
      visible={visible}
      title="Color"
      onClose={onClose}
      variant="center"
      closeOnBackdrop
    >
      <View style={styles.wrap}>
        <Pressable
          onPress={() => {
            onSelect(undefined);
            onClose();
          }}
          style={[
            styles.noneBtn,
            {
              borderColor: themeColors.borderSubtle,
              backgroundColor: surface,
            },
          ]}
        >
          <MText variant="bodyStrong" color="textPrimary">
            No color
          </MText>
        </Pressable>

        <View style={styles.grid}>
          {palette.map((c) => {
            const selected = isSelected.has(c);
            return (
              <Pressable
                key={c}
                onPress={() => {
                  onSelect(c);
                  onClose();
                }}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  selected
                    ? { borderWidth: 3, borderColor: themeColors.textPrimary }
                    : { borderWidth: 1, borderColor: themeColors.borderSubtle },
                ]}
              />
            );
          })}
        </View>
        <View style={styles.footer}>
          <Pressable
            onPress={() => {
              onSelect(undefined);
              onClose();
            }}
            style={styles.clearBtn}
          >
            <MText variant="body">Default</MText>
          </Pressable>
        </View>
      </View>
    </AppModal>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  noneBtn: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignSelf: "flex-start",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 999,
  },
  footer: {
    marginTop: spacing.lg,
    alignItems: "center",
  },
  clearBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
  },
});
