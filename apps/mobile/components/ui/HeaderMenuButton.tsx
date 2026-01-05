// components/ui/HeaderMenuButton.tsx
import React from "react";
import { IconButton } from "@musti/ui-native/src/components/AppIcon";
import { spacing } from "@musti/ui-native";

type HeaderMenuButtonProps = {
  onPress?: () => void;
};

export function HeaderMenuButton({ onPress }: HeaderMenuButtonProps) {
  return (
    <IconButton
      family="ion"
      name="menu"
      padding={spacing.xs}
      backgroundColor="transparent"
      onPress={onPress}
    />
  );
}
