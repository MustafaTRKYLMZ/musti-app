import React from "react";
import { StyleSheet, ScrollView } from "react-native";
import { AppScreen } from "@/components/AppScreen";
import { IconButton } from "@/components/ui/AppIcon";
import { MText, colors, spacing } from "@budget/ui-native";
import { router } from "expo-router";
import { useTranslation } from "@budget/core";

export default function AboutScreen() {
  const { t } = useTranslation();

  const handleClose = () => {
    router.back();
  };

  return (
    <AppScreen
      headerLeft={
        <IconButton
          family="ion"
          name="close"
          size={22}
          color={colors.textPrimary}
          onPress={handleClose}
        />
      }
      headerCenter={
        <MText variant="heading2" color="textPrimary">
          {t("about")}
        </MText>
      }
    >
      <ScrollView contentContainerStyle={styles.content}>
        <MText style={styles.description}>
          Budget app · personal finance tracker.
        </MText>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  description: {
    fontSize: 15,
    color: colors.textPrimary,
  },
});
