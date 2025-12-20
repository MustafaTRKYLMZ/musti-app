import { TouchableOpacity, ViewStyle } from "react-native";
import { MText, colors, spacing, radii } from "@budget/ui-native";

interface QuickChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export const QuickChip = ({ label, active, onPress }: QuickChipProps) => {
  const chipStyle: ViewStyle = {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: active ? colors.primary : "transparent",
    borderWidth: 1,
    borderColor: active ? colors.primary : colors.borderSubtle,
  };

  return (
    <TouchableOpacity onPress={onPress} style={chipStyle}>
      <MText variant="bodyStrong" color={active ? "textInverse" : "textMuted"}>
        {label}
      </MText>
    </TouchableOpacity>
  );
};
