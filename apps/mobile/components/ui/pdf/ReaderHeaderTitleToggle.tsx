import React, { FC } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MText, spacing, useTheme } from "/ui-native";
import { BaseIcon } from "@/components/ui/AppIcon";

type ReaderHeaderTitleToggleProps = {
  title: string;
  open: boolean;
  onToggle: () => void;
};

export const ReaderHeaderTitleToggle: FC<ReaderHeaderTitleToggleProps> = ({
  title,
  open,
  onToggle,
}) => {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [styles.topRow, { opacity: pressed ? 0.85 : 1 }]}
      hitSlop={8}
    >
      <MText
        variant="heading2"
        color="textPrimary"
        numberOfLines={1}
        style={styles.title}
      >
        {title}
      </MText>

      <View style={styles.chevronHit}>
        <BaseIcon
          family="ion"
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textSecondary}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
  },
  title: {
    flex: 1,
    marginRight: spacing.sm,
  },
  chevronHit: {
    paddingLeft: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
