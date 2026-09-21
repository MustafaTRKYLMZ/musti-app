import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BaseIcon, MText, spacing, useTheme } from "@musti/ui-native";
import { bookshelfScreenStyles } from "@/components/Books/bookshelfScreenStyles";

type Props = {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function SettingsCollapsibleSection({
  title,
  subtitle,
  defaultOpen = true,
  children,
}: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={bookshelfScreenStyles.sectionCard}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={styles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={styles.headerText}>
          <MText variant="heading3" color="textPrimary">
            {title}
          </MText>
          {subtitle ? (
            <MText variant="caption" color="textSecondary">
              {subtitle}
            </MText>
          ) : null}
        </View>
        <BaseIcon
          name={open ? "chevron-up" : "chevron-down"}
          color={colors.textSecondary}
        />
      </Pressable>

      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    minHeight: 44,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  body: {
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
});
