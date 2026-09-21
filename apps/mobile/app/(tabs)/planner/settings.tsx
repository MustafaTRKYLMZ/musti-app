import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, useTheme } from "@musti/ui-native";
import { CalendarAccountsSection } from "@/components/planner/CalendarAccountsSection";

export default function PlannerSettingsScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <CalendarAccountsSection />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing["3xl"],
  },
});
