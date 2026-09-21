import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useTranslation } from "@musti/core";
import { MText, bookshelfTheme } from "@musti/ui-native";

const { colors, spacing, radii } = bookshelfTheme;

export type BookshelfTopTab = "plans" | "targets";

type Props = {
  value: BookshelfTopTab;
  onChange: (tab: BookshelfTopTab) => void;
  style?: any;
};

export function BookshelfTabs({ value, onChange, style }: Props) {
  const { t } = useTranslation();
  return (
    <View style={[styles.wrap, style]}>
      <Pressable
        onPress={() => onChange("plans")}
        style={[styles.tab, value === "plans" && styles.activeTab]}
      >
        <MText
          variant="bodyStrong"
          color={value === "plans" ? "textPrimary" : "textSecondary"}
          style={value === "plans" ? styles.activeText : styles.inactiveText}
        >
          {t("bookshelf.tabs.plans")}
        </MText>
      </Pressable>

      <Pressable
        onPress={() => onChange("targets")}
        style={[styles.tab, value === "targets" && styles.activeTab]}
      >
        <MText
          variant="bodyStrong"
          color={value === "targets" ? "textPrimary" : "textSecondary"}
          style={value === "targets" ? styles.activeText : styles.inactiveText}
        >
          {t("bookshelf.tabs.targets")}
        </MText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignSelf: "flex-start",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    padding: spacing.xs,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
    minHeight: 44,
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: colors.background,
  },
  inactiveText: {
    opacity: 0.85,
  },
  activeText: {
    opacity: 1,
  },
});
