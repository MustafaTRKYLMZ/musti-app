import React from "react";
import { Alert } from "react-native";
import { IconButton, iconSizes, useTheme } from "@musti/ui-native";

export function InfoIcon({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  const { colors } = useTheme();

  return (
    <IconButton
      name="information-circle-outline"
      color={colors.textSecondary}
      onPress={() =>
        Alert.alert(title, message, [{ text: "OK" }], { cancelable: true })
      }
      accessibilityLabel={`Info: ${title}`}
    />
  );
}
