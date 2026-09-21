import { useTranslation } from "@musti/core";
import {
  spacing,
  MText,
  radii,
  bookshelfTheme,
  BaseIcon,
  touchTargets,
} from "@musti/ui-native";
import { Pressable, View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { FC } from "react";

type DoneTargetsShortcutProps = {
  count: number;
  onPress: () => void;
  variant?: "card" | "bar";
  style?: StyleProp<ViewStyle>;
};

const { colors } = bookshelfTheme;

export const DoneTargetsShortcut: FC<DoneTargetsShortcutProps> = ({
  count,
  onPress,
  variant = "card",
  style,
}) => {
  const { t } = useTranslation();

  if (variant === "bar") {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.bar,
          pressed && styles.pressed,
          style,
        ]}
      >
        <View style={styles.barIconWrap}>
          <BaseIcon name="checkmark-circle" color={colors.success} />
        </View>
        <MText variant="bodyStrong" style={styles.barLabel} numberOfLines={1}>
          {t("bookshelf.doneWithCount").replace("{{count}}", String(count))}
        </MText>
        <BaseIcon name="chevron-forward" color={colors.textSecondary} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.cardIconWrap}>
        <BaseIcon name="checkmark-circle" color={colors.success} />
      </View>

      <MText variant="caption" style={styles.cardTitle} numberOfLines={2}>
        {t("bookshelf.done")}
      </MText>

      <View style={styles.countBadge}>
        <MText variant="bodyStrong" style={styles.countText}>
          {count}
        </MText>
      </View>

      <BaseIcon
        name="chevron-forward"
        color={colors.textSecondary}
        style={styles.cardChevron}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.92,
  },

  card: {
    width: 120,
    alignSelf: "stretch",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    minHeight: touchTargets.comfortable,
  },
  cardIconWrap: {
    width: touchTargets.control,
    height: touchTargets.control,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontWeight: "600",
    textAlign: "center",
  },
  countBadge: {
    minWidth: 28,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: "center",
  },
  countText: {},
  cardChevron: {
    marginTop: 2,
  },

  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: touchTargets.minimum,
  },
  barIconWrap: {
    width: touchTargets.control,
    height: touchTargets.control,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  barLabel: {
    flex: 1,
  },
});
