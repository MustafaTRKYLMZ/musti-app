import React from "react";
import { View, Pressable, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { BaseIcon, MText, radii, spacing, useTheme } from "@musti/ui-native";

type Props = {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({
  icon = "file-tray-outline",
  title,
  subtitle,
  actionLabel,
  onAction,
  compact = false,
  style,
}: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        compact ? styles.compactWrap : styles.wrap,
        !compact && {
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surface,
        },
        style,
      ]}
    >
      {!compact ? (
        <BaseIcon name={icon} size={40} color={colors.textSecondary} />
      ) : null}

      <MText
        variant={compact ? "body" : "bodyStrong"}
        color={compact ? "textSecondary" : "textPrimary"}
        style={compact ? undefined : styles.title}
      >
        {title}
      </MText>

      {subtitle ? (
        <MText
          variant="body"
          color="textSecondary"
          style={styles.subtitle}
        >
          {subtitle}
        </MText>
      ) : null}

      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={[
            styles.actionBtn,
            {
              borderColor: colors.borderSubtle,
              backgroundColor: colors.surfaceElevated ?? colors.surface,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <MText variant="bodyStrong" color="primary">
            {actionLabel}
          </MText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  compactWrap: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
  },
  actionBtn: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
});
