// app/launcher.tsx
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  MText,
  colors,
  spacing,
  radii,
  iconSizes,
  shadows,
} from "@budget/ui-native";

export default function LauncherScreen() {
  const router = useRouter();

  const handleOpenBudget = () => {
    router.push("/(tabs)/budget");
  };

  const handleOpenBookshelf = () => {
    router.push("/(tabs)/bookshelf");
  };

  return (
    <View style={styles.container}>
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
          style={styles.card}
          activeOpacity={0.9}
          onPress={handleOpenBudget}
        >
          <View style={styles.iconWrapper}>
            <Ionicons
              name="wallet-outline"
              size={iconSizes.xl}
              color={colors.success}
            />
          </View>
          <MText variant="heading3" style={styles.cardTitle}>
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
          style={styles.card}
          activeOpacity={0.9}
          onPress={handleOpenBookshelf}
        >
          <View style={styles.iconWrapper}>
            <Ionicons
              name="book-outline"
              size={iconSizes.xl}
              color={colors.success}
            />
          </View>
          <MText variant="heading3" style={styles.cardTitle}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing["3xl"],
  },
  header: {
    marginBottom: spacing["2xl"],
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
    backgroundColor: colors.surface ?? colors.surface ?? "#fff",
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
