import { bookshelfTheme, MText } from "@musti/ui-native";
import { View, StyleSheet } from "react-native";
import { IconButton } from "./ui/AppIcon";
import { FC } from "react";

const { colors, spacing, radii } = bookshelfTheme;
type ShelfHeaderProps = {
  handleOpen: () => void;
  title: string;
};
export const ShelfHeader: FC<ShelfHeaderProps> = ({ handleOpen, title }) => {
  return (
    <View style={styles.shelfHeader}>
      <MText variant="heading3" color="textPrimary" style={styles.shelfTitle}>
        {title}
      </MText>
      <IconButton
        family="ion"
        name="add-circle-outline"
        padding={spacing.xs}
        color={colors.textPrimary}
        style={[styles.iconButton, { borderRadius: radii.full }]}
        onPress={handleOpen}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  shelfHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  shelfTitle: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  iconButton: {
    marginLeft: 4,
  },
});
