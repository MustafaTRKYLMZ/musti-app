import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MText, colors, spacing, radii, BaseIcon, iconSizes } from "@musti/ui-native";

export type StorePickerOption = {
  id: string | null;
  name: string;
  hint?: string;
};

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: StorePickerOption[];
  selectedId?: string | null;
  cancelLabel: string;
  onSelect: (id: string | null) => void;
  onCancel: () => void;
};

export function StorePickerSheet({
  visible,
  title,
  subtitle,
  options,
  selectedId,
  cancelLabel,
  onSelect,
  onCancel,
}: Props) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} />

        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing["2xl"]) },
          ]}
        >
          <View style={styles.handle} />

          <MText variant="heading3" color="textPrimary" style={styles.title}>
            {title}
          </MText>

          {subtitle ? (
            <MText variant="body" color="textSecondary" style={styles.subtitle}>
              {subtitle}
            </MText>
          ) : null}

          <ScrollView
            style={styles.optionsScroll}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {options.map((option) => {
              const selected =
                selectedId === option.id ||
                (selectedId == null && option.id == null);

              return (
                <TouchableOpacity
                  key={option.id ?? "no-store"}
                  style={[styles.optionButton, selected && styles.optionSelected]}
                  onPress={() => onSelect(option.id)}
                >
                  <View style={styles.optionRow}>
                    <BaseIcon
                      name={
                        option.id ? "storefront-outline" : "ellipsis-horizontal"
                      }
                      size={iconSizes.md}
                      color={selected ? colors.primaryLight : colors.textSecondary}
                    />
                    <View style={styles.optionCopy}>
                      <MText variant="bodyStrong" color="textPrimary">
                        {option.name}
                      </MText>
                      {option.hint ? (
                        <MText variant="caption" color="textMuted">
                          {option.hint}
                        </MText>
                      ) : null}
                    </View>
                    {selected ? (
                      <BaseIcon
                        name="checkmark-circle"
                        size={iconSizes.md}
                        color={colors.primaryLight}
                      />
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <MText variant="bodyStrong" color="textSecondary">
              {cancelLabel}
            </MText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.backdropStrong,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.borderSubtle,
    maxHeight: "72%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.borderSubtle,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.md,
  },
  optionsScroll: {
    maxHeight: 360,
  },
  optionButton: {
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  optionSelected: {
    borderColor: colors.primaryLight,
    backgroundColor: "rgba(0,73,168,0.18)",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  optionCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  cancelButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
