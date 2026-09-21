import { MText, spacing } from "@musti/ui-native";
import { FC } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "@musti/core";
import { HeaderIconButton } from "@/components/ui/HeaderIconButton";

type SectionHeaderProps = {
  title: string;
  onClose: () => void;
};
export const SectionHeader: FC<SectionHeaderProps> = ({ title, onClose }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.headerRow}>
      <MText variant="heading3">{title}</MText>
      <HeaderIconButton
        icon="close"
        variant="plain"
        onPress={onClose}
        accessibilityLabel={t("bookshelf.chapters.close")}
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
});
