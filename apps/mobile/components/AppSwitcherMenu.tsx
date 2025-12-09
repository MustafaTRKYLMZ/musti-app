// components/AppSwitcherMenu.tsx
import React from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radii, iconSizes, MText } from "@budget/ui-native";
import { router } from "expo-router";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AppSwitcherMenu({ visible, onClose }: Props) {
  const goBudget = () => {
    onClose();
    router.push("/(tabs)/budget");
  };

  const goBookshelf = () => {
    onClose();
    router.push("/(tabs)/bookshelf");
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      {/* arka plan */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* açılır submenu panel */}
      <View style={styles.menuContainer}>
        <View style={styles.grid}>
          {/* Budget */}
          <TouchableOpacity style={styles.item} onPress={goBudget}>
            <View style={styles.iconWrapper}>
              <Ionicons
                name="wallet-outline"
                size={iconSizes.xl}
                color={colors.success}
              />
            </View>
            <MText style={styles.label}>Budget</MText>
          </TouchableOpacity>

          {/* Bookshelf */}
          <TouchableOpacity style={styles.item} onPress={goBookshelf}>
            <View style={styles.iconWrapper}>
              <Ionicons
                name="book-outline"
                size={iconSizes.xl}
                color={colors.success}
              />
            </View>
            <MText style={styles.label}>Bookshelf</MText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  menuContainer: {
    position: "absolute",
    top: spacing["5xl"],
    right: spacing["2xl"],
    width: 230,
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  menuTitle: {
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    width: 90,
  },
  iconWrapper: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.xs,
  },
  label: {
    textAlign: "center",
    fontSize: 13,
    color: colors.textPrimary,
  },
});
