import { iconSizes, MText, spacing } from "@musti/ui-native";
import { TouchableOpacity, StyleSheet } from "react-native";
import { BaseIcon } from "./ui/AppIcon";

export const MenuRow = ({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <BaseIcon name={icon} size={iconSizes.md} color={color} />
    <MText style={{ fontWeight: "800", color }}>{label}</MText>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  menuItem: {
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
