import React, { useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";

import { BaseIcon } from "@/components/ui/AppIcon";
import { Card, MText, radii, spacing, useTheme } from "/ui-native";
import { formatModeParts } from "@/utils/formatModeParts";
import type { BookRow } from "./types";

type Props = {
  item: BookRow;
  onPress: () => void;
};

export function BookRowCard({ item, onPress }: Props) {
  const { colors } = useTheme();

  const parts = useMemo(
    () => formatModeParts(item.pagesByMode),
    [item.pagesByMode]
  );

  return (
    <Pressable onPress={onPress}>
      <Card
        style={[
          styles.rowCard,
          { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
        ]}
      >
        <View style={styles.rowTop}>
          <View style={{ flex: 1 }}>
            <MText variant="bodyStrong" color="textPrimary" numberOfLines={1}>
              {item.bookName}
            </MText>
            <MText variant="caption" color="textSecondary" numberOfLines={1}>
              {item.pagesTotal} pages
            </MText>
          </View>

          <View
            style={[
              styles.totalPill,
              {
                backgroundColor: colors.surfaceStrong,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <MText
              variant="caption"
              color="textPrimary"
              style={{ fontWeight: "900" }}
            >
              {item.pagesTotal}
            </MText>
          </View>
        </View>

        {parts.length > 0 ? (
          <View style={styles.modesRow}>
            {parts.map((p) => (
              <View key={p.mode} style={styles.modeChip}>
                <BaseIcon
                  name={p.icon as any}
                  size={12}
                  color={colors.textSecondary}
                />
                <MText variant="caption" color="textSecondary">
                  {p.value}
                </MText>
              </View>
            ))}
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rowCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  totalPill: {
    minWidth: 36,
    height: 26,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  modesRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  modeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
