// components/ui/HeaderMenuButton.tsx
import React from "react";
import { useTranslation } from "@musti/core";
import { HeaderIconButton } from "./HeaderIconButton";

type HeaderMenuButtonProps = {
  onPress?: () => void;
};

export function HeaderMenuButton({ onPress }: HeaderMenuButtonProps) {
  const { t } = useTranslation();

  return (
    <HeaderIconButton
      icon="menu-outline"
      variant="plain"
      accessibilityLabel={t("common.menu")}
      onPress={() => onPress?.()}
    />
  );
}
