import { MText, radii, spacing, useTheme } from "@musti/ui-native";
import { TouchableOpacity, StyleSheet } from "react-native";

export const HeaderPill = ({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.pill, { borderColor: colors.borderSubtle }]}
    >
      <MText variant="caption" style={{ color: colors.textPrimary }}>
        {label}
      </MText>
    </TouchableOpacity>
  );
};

export const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
});
