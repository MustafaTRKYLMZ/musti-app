import React, { FC } from "react";
import { View, StyleSheet } from "react-native";
import { MText, colors, spacing, radii } from "@budget/ui-native";
import { IconButton } from "@/components/ui/AppIcon";

type BookshelfHeaderProps = {
  handleOpenModal: () => void;
  handleOpenPlanModal: () => void;
};

export const BookshelfHeader: FC<BookshelfHeaderProps> = ({
  handleOpenModal,
  handleOpenPlanModal,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <MText variant="heading1" style={styles.headerTitle}>
          Bookshelf
        </MText>
      </View>

      <View style={styles.headerRight}>
        <IconButton
          family="ion"
          name="list-outline"
          padding={spacing.xs}
          style={styles.iconButton}
          onPress={handleOpenPlanModal}
        />

        <IconButton
          family="ion"
          name="add-circle-outline"
          color={colors.success}
          padding={spacing.xs}
          style={styles.iconButton}
          onPress={handleOpenModal}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    padding: spacing.sm,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.sm,
  },
  headerTitle: {
    flexShrink: 1,
  },
  iconButton: {
    borderRadius: radii.full,
    marginLeft: spacing.xs,
  },
});
