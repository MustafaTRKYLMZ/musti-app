import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { MText, colors, spacing, radii } from "@budget/ui-native";

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
  if (!visible) return null;

  return (
    <View style={localStyles.overlay}>
      <TouchableOpacity
        style={localStyles.backdrop}
        activeOpacity={1}
        onPress={onCancel}
      />

      <View style={localStyles.sheet}>
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
  );
}

const localStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "flex-end",
    zIndex: 80,
    elevation: 80,
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
    paddingBottom: spacing["2xl"],
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
