import { useMemo } from "react";
import { useTheme } from "/ui-native";

export const useChipColors=()=> {
  const { colors } = useTheme();

  return useMemo(
    () => ({
      active: {
        bg: colors.surfaceElevated,
        border: colors.borderSubtle,
        text: colors.textPrimary,
        icon: colors.textSecondary,
      },
      inactive: {
        bg: colors.surface,
        border: colors.borderSubtle,
        text: colors.textPrimary,
        icon: colors.textSecondary,
      },
    }),
    [colors]
  );
}
