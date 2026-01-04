import { bookshelfTheme, iconSizes, radii, spacing } from "@musti/ui-native";
import { router } from "expo-router";
import { View, StyleSheet } from "react-native";
import { IconTile } from "../ui/AppIcon";
import { FC } from "react";

const { colors } = bookshelfTheme;
type PlanBottomActionButtonsProps = {
  handleDelete: () => void;
  handleSave: () => void;
};
export const PlanBottomActionButtons: FC<PlanBottomActionButtonsProps> = ({
  handleDelete,
  handleSave,
}) => {
  return (
    <View
      style={[
        styles.actions,
        {
          borderTopColor: colors.borderSubtle,
          backgroundColor: colors.background,
        },
      ]}
    >
      <IconTile
        name="close-outline"
        label="Cancel"
        size={iconSizes.lg}
        onPress={() => router.back()}
        style={[
          styles.btn,
          {
            borderColor: colors.borderSubtle,
            backgroundColor: colors.surface,
          },
        ]}
      />
      <IconTile
        name="trash-outline"
        label="Delete"
        size={iconSizes.lg}
        onPress={handleDelete}
        style={[
          styles.btn,
          {
            borderColor: colors.borderSubtle,
            backgroundColor: colors.surface,
          },
        ]}
      />
      <IconTile
        name="checkmark-outline"
        label="Save"
        size={iconSizes.lg}
        onPress={handleSave}
        style={[
          styles.btn,
          {
            backgroundColor: colors.surface,
            borderColor: "transparent",
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
  },

  actions: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: spacing["2xl"],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
});
