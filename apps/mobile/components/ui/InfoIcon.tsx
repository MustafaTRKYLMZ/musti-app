import React from "react";
import { Alert } from "react-native";
import { IconButton } from "@musti/ui-native";
import { bookshelfTheme } from "@musti/ui-native";

const { colors, iconSizes } = bookshelfTheme;

export function InfoIcon({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <IconButton
      name="information-circle-outline"
      size={iconSizes.sm}
      color={colors.textSecondary}
      onPress={() =>
        Alert.alert(title, message, [{ text: "OK" }], { cancelable: true })
      }
      accessibilityLabel={`Info: ${title}`}
    />
  );
}
