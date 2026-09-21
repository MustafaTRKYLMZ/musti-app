import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { BaseIcon, MText, spacing, radii, useTheme } from "@musti/ui-native";
import { useGoogleCalendarConnect } from "@/hooks/useGoogleCalendarConnect";

export function GoogleCalendarConnectPanel() {
  const { colors } = useTheme();
  const { connectGoogle, isConnecting, error, canPrompt } =
    useGoogleCalendarConnect();

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
            <BaseIcon name="logo-google" size={18} color={colors.textInverse} />
            <MText
              variant="body"
              style={{ color: colors.textInverse, fontWeight: "700" }}
            >
              Connect Google account
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
