import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { MText, bookshelfTheme } from "@budget/ui-native";

const { colors, spacing, radii } = bookshelfTheme;

export type BookshelfTopTab = "plans" | "targets";

type Props = {
  value: BookshelfTopTab;
  onChange: (tab: BookshelfTopTab) => void;
  style?: any;
};

export function BookshelfTabs({ value, onChange, style }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <Pressable
        onPress={() => onChange("plans")}
        style={[styles.tab, value === "plans" && styles.activeTab]}
      >
        <MText style={[styles.text, value === "plans" && styles.activeText]}>
          Plans
        </MText>
      </Pressable>

      <Pressable
        onPress={() => onChange("targets")}
        style={[styles.tab, value === "targets" && styles.activeTab]}
      >
        <MText style={[styles.text, value === "targets" && styles.activeText]}>
          Targets
        </MText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignSelf: "flex-start",
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.full,
    padding: 4,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
  },
  activeTab: {
    backgroundColor: colors.background,
  },
  text: {
    fontWeight: "600",
    opacity: 0.7,
  },
  activeText: {
    opacity: 1,
    color: colors.textInverse,
  },
});
