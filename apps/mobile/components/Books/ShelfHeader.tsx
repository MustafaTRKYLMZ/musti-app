import { bookshelfTheme, MText } from "@musti/ui-native";
import { View, StyleSheet } from "react-native";
import { FC } from "react";
import { SectionAddButton } from "@/components/ui/SectionAddButton";
import { SECTION_HEADER_GAP } from "./shelfLayout";

const { spacing } = bookshelfTheme;

type ShelfHeaderProps = {
  handleOpen: () => void;
  title: string;
  addA11yLabel?: string;
};

export const ShelfHeader: FC<ShelfHeaderProps> = ({
  handleOpen,
  title,
  addA11yLabel = "Add",
}) => {
  return (
    <View style={styles.shelfHeader}>
      <MText variant="heading3" color="textPrimary">
        {title}
      </MText>
      <SectionAddButton onPress={handleOpen} accessibilityLabel={addA11yLabel} />
    </View>
  );
};

const styles = StyleSheet.create({
  shelfHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginBottom: SECTION_HEADER_GAP,
  },
});
