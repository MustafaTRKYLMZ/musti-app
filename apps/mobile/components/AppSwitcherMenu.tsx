// components/AppSwitcherMenu.tsx
import React from "react";
import { Modal, View, StyleSheet, Pressable } from "react-native";
import {
  spacing,
  radii,
  MText,
  useTheme,
  budgetTheme,
  bookshelfTheme,
} from "@budget/ui-native";
import { router } from "expo-router";
import { IconTile } from "@/components/ui/AppIcon";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AppSwitcherMenu({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

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
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.menuContainer}>
        <MText variant="heading3" style={styles.menuTitle}>
          Apps
        </MText>

        <View style={styles.grid}>
          <IconTile
            name="wallet-outline"
            label="Budget"
            color={budgetTheme.colors.success}
            labelColor={colors.textInverse}
            onPress={goBudget}
          />

          <IconTile
            name="book-outline"
            label="Bookshelf"
            color={bookshelfTheme.colors.success}
            labelColor={colors.textInverse}
            onPress={goBookshelf}
          />
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: typeof budgetTheme.colors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.backdropStrong,
    },
    menuContainer: {
      position: "absolute",
      top: spacing["5xl"],
      right: spacing["2xl"],
      width: 230,
      backgroundColor: colors.surfaceStrong,
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
  });
