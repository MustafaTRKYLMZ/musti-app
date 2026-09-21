import React from "react";
import { HeaderIconButton } from "./HeaderIconButton";

type Props = {
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
};

/** Same shell + glyph size as header toolbar icon buttons (44×44, 24px). */
export function SectionAddButton({
  onPress,
  accessibilityLabel,
  disabled = false,
}: Props) {
  return (
    <HeaderIconButton
      icon="add"
      variant="circle"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
    />
  );
}
