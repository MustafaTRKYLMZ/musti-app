import { BaseIcon } from "@/components/ui/AppIcon";
import {
  bookshelfTheme,
  iconSizes,
  MText,
  radii,
  spacing,
} from "@musti/ui-native";
import { Pressable, View, StyleSheet } from "react-native";

const { colors } = bookshelfTheme;
export const RowAction = ({
  label,
  value,
  icon,
  onPress,
}: {
  label: string;
  value: string;
  icon: string;
  onPress: () => void;
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.rowBtn,
        {
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surfaceElevated,
        },
      ]}
    >
      <View style={styles.rowBtnLeft}>
        <BaseIcon
          name={icon as any}
          size={iconSizes.md}
          color={colors.textSecondary}
        />
        <MText style={{ color: colors.textPrimary, fontWeight: "800" }}>
          {label}
        </MText>
      </View>
      <View style={styles.rowBtnRight}>
        <MText style={{ color: colors.textSecondary, fontWeight: "900" }}>
          {value}
        </MText>
        <BaseIcon
          name={"chevron-forward" as any}
          size={iconSizes.md}
          color={colors.textSecondary}
        />
      </View>
    </Pressable>
  );
};
const styles = StyleSheet.create({
  rowBtn: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowBtnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rowBtnRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
