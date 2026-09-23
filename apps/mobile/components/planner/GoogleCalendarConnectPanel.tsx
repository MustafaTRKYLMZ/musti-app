import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "@musti/core";
import { BaseIcon, MText, spacing, radii, useTheme } from "@musti/ui-native";
import { useGoogleCalendarConnectContext } from "@/context/GoogleCalendarConnectProvider";

export function GoogleCalendarConnectPanel() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { connectGoogle, isConnecting, error, canPrompt } =
    useGoogleCalendarConnectContext();

  return (
    <View style={styles.wrap}>
      {error ? (
        <MText variant="caption" style={{ color: colors.danger }}>
          {error}
        </MText>
      ) : null}

      <Pressable
        style={[
          styles.primaryBtn,
          {
            backgroundColor: colors.success,
            opacity: !canPrompt || isConnecting ? 0.6 : 1,
          },
        ]}
        disabled={!canPrompt || isConnecting}
        onPress={() => void connectGoogle()}
      >
        {isConnecting ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <>
            <BaseIcon name="logo-google" color={colors.textInverse} />
            <MText
              variant="body"
              style={{ color: colors.textInverse, fontWeight: "700" }}
            >
              {t("planner.google.connect")}
            </MText>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
  },
});
