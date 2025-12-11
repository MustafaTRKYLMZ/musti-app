import React, { FC } from "react";
import { View, StyleSheet } from "react-native";
import { MText, useTheme } from "@budget/ui-native";
import { IconButton } from "@/components/ui/AppIcon";

export const BookshelfHeader = () => {
  const theme = useTheme();
  const { spacing } = theme;

  return (
    <View style={[styles.header, { paddingHorizontal: spacing.sm }]}>
      <View style={[styles.headerLeft, { padding: spacing.sm }]}>
        <MText variant="heading1" style={styles.headerTitle}>
          Bookshelf
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
