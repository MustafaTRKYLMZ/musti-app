// components/ui/HeaderMenuButton.tsx
import React from "react";
import { StyleSheet } from "react-native";
import { IconButton } from "./AppIcon";
import { colors, spacing, radii } from "@budget/ui-native";

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
