import {
  spacing,
  iconSizes,
  MText,
  radii,
  bookshelfTheme,
} from "@budget/ui-native";
import { Pressable, View, StyleSheet } from "react-native";
import { IconButton } from "../ui/AppIcon";
import { FC } from "react";

type DoneTargetsShortcutProps = {
  count: number;
  onPress: () => void;
};
const { colors } = bookshelfTheme;

export const DoneTargetsShortcut: FC<DoneTargetsShortcutProps> = ({
  count,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.doneMini, { marginLeft: spacing.sm }]}
    >
      <View style={styles.doneIconWrap}>
        <IconButton
          name="checkmark"
          size={iconSizes.md}
          color={colors.textPrimary}
          onPress={onPress}
        />
      </View>
      <View style={{ flex: 1, flexDirection: "row", gap: spacing.sm }}>
        <MText style={{ fontWeight: "900" }}>Done</MText>
        <MText style={{ opacity: 0.7, marginTop: 2 }}>{count}</MText>
      </View>
      <IconButton
        name="chevron-forward"
        size={iconSizes.md}
        color={colors.textPrimary}
        onPress={onPress}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  doneMini: {
    minWidth: 150,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  doneIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
