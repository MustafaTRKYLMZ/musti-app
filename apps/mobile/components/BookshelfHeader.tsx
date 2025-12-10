import React, { FC } from "react";
import { View, StyleSheet } from "react-native";
import { MText, useTheme } from "@budget/ui-native";
import { IconButton } from "@/components/ui/AppIcon";

type BookshelfHeaderProps = {
  handleOpenModal: () => void;
  handleOpenPlanModal: () => void;
};

export const BookshelfHeader: FC<BookshelfHeaderProps> = ({
  handleOpenModal,
  handleOpenPlanModal,
}) => {
  const theme = useTheme();
  const { colors, spacing, radii } = theme;

  return (
    <View style={[styles.header, { paddingHorizontal: spacing.sm }]}>
      <View style={[styles.headerLeft, { padding: spacing.sm }]}>
        <MText variant="heading1" style={styles.headerTitle}>
          Bookshelf
        </MText>
      </View>

      <View style={[styles.headerRight, { paddingRight: spacing.sm }]}>
        <IconButton
          family="ion"
          name="list-outline"
          padding={spacing.xs}
          color={colors.textPrimary}
          style={[styles.iconButton, { borderRadius: radii.full }]}
          onPress={handleOpenPlanModal}
        />

        <IconButton
          family="ion"
          name="add-circle-outline"
          color={colors.textPrimary}
          padding={spacing.xs}
          style={[styles.iconButton, { borderRadius: radii.full }]}
          onPress={handleOpenModal}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    flexShrink: 1,
  },
  iconButton: {
    marginLeft: 4,
  },
});
