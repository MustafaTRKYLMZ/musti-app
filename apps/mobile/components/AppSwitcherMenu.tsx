import React from "react";
import { Modal, View, StyleSheet, Pressable } from "react-native";
import {
  spacing,
  radii,
  MText,
  useTheme,
  budgetTheme,
  bookshelfTheme,
} from "@musti/ui-native";
import { router } from "expo-router";
import { IconTile } from "@musti/ui-native";

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
  const goPlanner = () => {
    onClose();
    router.push("/(tabs)/planner");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={styles.menuContainer}
          android_disableSound
        >
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
              style={{ backgroundColor: colors.backgroundBackdrop }}
            />

            <IconTile
              name="book-outline"
              label="Bookshelf"
              color={bookshelfTheme.colors.success}
              labelColor={colors.textInverse}
              onPress={goBookshelf}
              style={{ backgroundColor: colors.backgroundBackdrop }}
            />
            <IconTile
              name="calendar-outline"
              label="Planner"
              color={bookshelfTheme.colors.success}
              labelColor={colors.textInverse}
              onPress={goPlanner}
              style={{ backgroundColor: colors.backgroundBackdrop }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (colors: typeof budgetTheme.colors) =>
  StyleSheet.create({
    overlay: {
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

      elevation: 20,

      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    menuTitle: { marginBottom: spacing.sm },
    grid: {
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: colors.surfaceStrong,
    },
  });
