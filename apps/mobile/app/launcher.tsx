import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import {
  MText,
  spacing,
  radii,
  iconSizes,
  shadows,
  useTheme,
} from "/ui-native";
import { BaseIcon } from "@/components/ui/AppIcon";

export default function LauncherScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const handleOpenBudget = () => {
    router.push("/(tabs)/budget");
  };

  const handleOpenBookshelf = () => {
    router.push("/(tabs)/bookshelf");
  };

  // ✅ Planner route (create this tab/stack)
  const handleOpenPlanner = () => {
    router.push("/(tabs)/planner");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <MText variant="heading1" style={styles.title}>
          Musti App
        </MText>
        <MText variant="body" color="textSecondary" style={styles.subtitle}>
          Choose an app to continue
        </MText>
      </View>

      <View style={styles.grid}>
        {/* Budget card */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface }]}
          activeOpacity={0.9}
          onPress={handleOpenBudget}
        >
          <View
            style={[styles.iconWrapper, { backgroundColor: colors.surface }]}
          >
            <BaseIcon
              family="ion"
              name="wallet-outline"
              size={iconSizes.xl}
              color={colors.success}
            />
          </View>

          <MText
            variant="heading3"
            style={[styles.cardTitle, { color: colors.textPrimary }]}
          >
            Budget
          </MText>
          <MText
            variant="body"
            color="textSecondary"
            style={styles.cardDescription}
          >
            Track income, expenses and run simulations.
          </MText>
        </TouchableOpacity>

        {/* Bookshelf card */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface }]}
          activeOpacity={0.9}
          onPress={handleOpenBookshelf}
        >
          <View
            style={[styles.iconWrapper, { backgroundColor: colors.surface }]}
          >
            <BaseIcon
              family="ion"
              name="book-outline"
              size={iconSizes.xl}
              color={colors.success}
            />
          </View>

          <MText
            variant="heading3"
            style={[styles.cardTitle, { color: colors.textPrimary }]}
          >
            Bookshelf
          </MText>
          <MText
            variant="body"
            color="textSecondary"
            style={styles.cardDescription}
          >
            Read PDFs and follow your daily reading plan.
          </MText>
        </TouchableOpacity>

        {/* ✅ Planner card */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface }]}
          activeOpacity={0.9}
          onPress={handleOpenPlanner}
        >
          <View
            style={[styles.iconWrapper, { backgroundColor: colors.surface }]}
          >
            <BaseIcon
              family="ion"
              name="calendar-outline"
              size={iconSizes.xl}
              color={colors.success}
            />
          </View>

          <MText
            variant="heading3"
            style={[styles.cardTitle, { color: colors.textPrimary }]}
          >
            Planner
          </MText>
          <MText
            variant="body"
            color="textSecondary"
            style={styles.cardDescription}
          >
            Plan your week, manage events, and sync with Google Calendar.
          </MText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: spacing["6xl"],
  },
  header: {
    marginTop: spacing["2xl"],
    marginBottom: spacing["2xl"],
    alignItems: "center",
  },
  title: {
    marginBottom: spacing.xs,
  },
  subtitle: {
    maxWidth: 260,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  card: {
    flexBasis: "48%",
    padding: spacing.lg,
    borderRadius: radii.xl,
    shadowColor: shadows.card.shadowColor,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  cardTitle: {
    marginBottom: spacing.xs,
  },
  cardDescription: {
    fontSize: 12,
  },
});
