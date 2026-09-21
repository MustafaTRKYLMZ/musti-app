import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "@musti/core";
import { MText, useTheme } from "@musti/ui-native";

export const BookshelfHeader = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { spacing } = theme;

  return (
    <View style={[styles.header, { paddingHorizontal: spacing.sm }]}>
      <View style={[styles.headerLeft, { padding: spacing.sm }]}>
        <MText variant="heading1" style={styles.headerTitle}>
          {t("bookshelf.title")}
        </MText>
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
  headerTitle: {
    flexShrink: 1,
  },
});
