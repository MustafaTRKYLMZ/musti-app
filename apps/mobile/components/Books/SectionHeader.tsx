import { MText, spacing } from "@musti/ui-native";
import { FC } from "react";
import { View, StyleSheet } from "react-native";
import { IconButton } from "@musti/ui-native/src/components/AppIcon";

type SectionHeaderProps = {
  title: string;
  onClose: () => void;
};
export const SectionHeader: FC<SectionHeaderProps> = ({ title, onClose }) => {
  return (
    <View style={styles.headerRow}>
      <MText variant="heading3">{title}</MText>
      <IconButton
        name="close-outline"
        style={styles.closeIcon}
        onPress={onClose}
        accessibilityLabel="Close chapters"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  closeIcon: {
    padding: spacing.xs,
  },
});
