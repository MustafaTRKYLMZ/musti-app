import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "@musti/core";
import { MText, spacing, useTheme } from "@musti/ui-native";
import { BaseIcon } from "@musti/ui-native/src/components/AppIcon";

export function ComingSoon() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <BaseIcon name="sparkles-outline" size={50} color={colors.textSecondary} />
      <MText variant="heading3" style={[styles.title, { color: colors.textPrimary }]}>
        {t("comingSoon.title")}
      </MText>
      <MText variant="body" color="textSecondary" style={styles.subtitle}>
        {t("comingSoon.subtitle")}
      </MText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  title: {
    marginTop: spacing.md,
  },
  subtitle: {
    marginTop: spacing.sm,
    textAlign: "center",
  },
});
