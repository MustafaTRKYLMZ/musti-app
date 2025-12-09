import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@budget/core";
import LanguageSelector from "../LanguageSelector";
import { MText, colors, spacing, radii, iconSizes } from "@budget/ui-native";
import { Link } from "expo-router";

interface Props {
  onOpenMenu: () => void;
  onOpenSimulation: () => void;
  onLanguageChange?: (msg: string) => void;
}

export function BudgetHeader({
  onOpenMenu,
  onOpenSimulation,
  onLanguageChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.headerRow}>
      {/* LEFT SIDE: menu + title */}
      <View style={styles.leftContainer}>
        <TouchableOpacity
          onPress={onOpenMenu}
          style={styles.menuButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu" size={22} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* RIGHT SIDE: bookshelf + simulation + language */}
      <View style={styles.rightContainer}>
        <Link href="/bookshelf" asChild>
          <TouchableOpacity
            style={styles.bookshelfButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="library-outline"
              size={iconSizes.lg}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </Link>

        <TouchableOpacity
          onPress={onOpenSimulation}
          style={styles.simButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="flask-outline"
            size={iconSizes.lg}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <LanguageSelector onLanguageChange={onLanguageChange} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
  },
  leftContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    flexShrink: 1,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    height: "100%",
    padding: spacing.sm,
  },
  menuButton: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  bookshelfButton: {
    padding: spacing.xs,
    borderRadius: radii.full,
    marginRight: spacing.xs,
  },
  simButton: {
    padding: spacing.xs,
    borderRadius: radii.full,
    marginRight: spacing.xs,
  },
});
