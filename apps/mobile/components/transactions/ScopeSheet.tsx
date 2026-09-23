import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MText, colors, spacing, radii } from "@musti/ui-native";

export type Scope = "this" | "thisAndFuture" | "all";

export type ScopeOption = {
  scope: Scope;
  label: string;
  variant?: "default" | "danger";
};

interface ScopeSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: ScopeOption[];
  cancelLabel: string;
  onSelect: (scope: Scope) => void;
  onCancel: () => void;
}

export function ScopeSheet({
  visible,
  title,
  subtitle,
  options,
  cancelLabel,
  onSelect,
  onCancel,
}: ScopeSheetProps) {
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
      <View style={localStyles.overlay}>
        <Pressable style={localStyles.backdrop} onPress={onCancel} />

        <View
          style={[
            localStyles.sheet,
            { paddingBottom: Math.max(insets.bottom, spacing["2xl"]) },
          ]}
        >
        <View style={localStyles.handle} />

        <MText variant="heading3" color="textPrimary" style={localStyles.title}>
          {title}
        </MText>

        {subtitle ? (
          <MText
            variant="body"
            color="textSecondary"
            style={localStyles.subtitle}
          >
            {subtitle}
          </MText>
        ) : null}

        {options.map((opt) => {
          const isDanger = opt.variant === "danger";

          return (
            <TouchableOpacity
              key={opt.scope}
              style={[
                localStyles.optionButton,
                isDanger && localStyles.optionDanger,
              ]}
              onPress={() => onSelect(opt.scope)}
            >
              <MText
                variant="bodyStrong"
                color={isDanger ? "danger" : "textPrimary"}
                style={localStyles.optionText}
              >
                {opt.label}
              </MText>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={localStyles.cancelButton} onPress={onCancel}>
          <MText variant="bodyStrong" color="textSecondary">
            {cancelLabel}
          </MText>
        </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
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

    shadowColor: colors.shadowStrong,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 30,
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
    marginBottom: spacing.lg,
  },
  optionButton: {
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  optionDanger: {
    borderColor: colors.danger,
  },
  optionText: {
    textAlign: "left",
  },
  cancelButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.background, // daha koyu, güzel bir kontrast
    alignItems: "center",
    justifyContent: "center",
  },
});
