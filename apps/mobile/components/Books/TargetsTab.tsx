import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { MText, bookshelfTheme, iconSizes } from "@budget/ui-native";
import { IconButton } from "@/components/ui/AppIcon";
import { useReadingTargetsStore } from "@/store/bookshelf/useReadingTargetsStore";

const { colors, spacing, radii } = bookshelfTheme;

type Props = {
  onOpen: () => void; // targets screen
};

export function TargetsTab({ onOpen }: Props) {
  const hydrate = useReadingTargetsStore((s) => s.hydrate);
  const hydrated = useReadingTargetsStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  return (
    <Pressable onPress={onOpen} style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <MText variant="heading3">Targets</MText>
        </View>

        <IconButton
          name="chevron-forward"
          size={iconSizes.lg}
          color={colors.textPrimary}
          onPress={onOpen}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  sub: {
    marginTop: spacing.xs,
    opacity: 0.8,
  },
  strong: {
    fontWeight: "700",
    opacity: 1,
  },
});
