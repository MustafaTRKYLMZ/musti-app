import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { router, Stack } from "expo-router";
import { MText, radii, spacing, useTheme } from "@budget/ui-native";

import { BookshelfNotificationsSection } from "@/components/settings/BookshelfNotificationsSection";
import { AppScreen } from "@/components/AppScreen";
import { IconButton } from "@/components/ui/AppIcon";

export default function BookshelfSettingsScreen() {
  const { colors } = useTheme();
  const onBack = () => {
    if (router.canGoBack?.()) router.back();
    else router.replace("/(tabs)/bookshelf");
  };
  return (
    <>
      <Stack.Screen options={{ title: "Bookshelf settings" }} />
      <AppScreen
        title="Bookshelf Settings"
        headerContainerStyle={{
          borderBottomWidth: 0,
          backgroundColor: colors.surface,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          shadowColor: colors.shadowStrong,
          shadowOpacity: 0.18,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
        }}
        headerLeft={
          <IconButton
            name="chevron-back"
            onPress={onBack}
            size={24}
            color={colors.textPrimary}
          />
        }
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.surface }}
          contentContainerStyle={styles.container}
        >
          <View style={styles.block}>
            <MText variant="heading2">Notifications</MText>
            <View style={{ height: spacing.md }} />
            <BookshelfNotificationsSection />
          </View>
        </ScrollView>
      </AppScreen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  block: {
    gap: spacing.md,
  },
});
