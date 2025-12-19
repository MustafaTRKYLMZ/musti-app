import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { MText, radii, spacing, useTheme } from "@budget/ui-native";
import type {
  ReadingTarget,
  TargetItemStatus,
} from "@/store/bookshelf/useReadingTargetsStore";

type Props = {
  target: ReadingTarget;
  activeItemId?: string | null;
  maxDots?: number; // default 7
};

export function TargetItemPager({ target, activeItemId, maxDots = 7 }: Props) {
  const { colors } = useTheme();
  const items = target.items ?? [];
  const total = items.length;

  const activeIndex = useMemo(() => {
    if (!total) return 0;
    if (activeItemId) {
      const idx = items.findIndex((i) => i.id === activeItemId);
      if (idx >= 0) return idx;
    }
    const a = items.findIndex((i) => i.status === "active");
    return a >= 0 ? a : 0;
  }, [items, total, activeItemId]);

  const counts = useMemo(() => {
    const c: Record<TargetItemStatus, number> = {
      done: 0,
      active: 0,
      pending: 0,
    };
    for (const it of items) c[it.status] = (c[it.status] ?? 0) + 1;
    return c;
  }, [items]);

  const dotCount = Math.min(total, maxDots);

  const dotActive = useMemo(() => {
    if (total <= dotCount) return activeIndex;
    // compress activeIndex into [0..dotCount-1]
    return Math.round((activeIndex / Math.max(1, total - 1)) * (dotCount - 1));
  }, [activeIndex, total, dotCount]);

  if (!total) return null;

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
      ]}
    >
      <View style={styles.row}>
        <MText
          variant="caption"
          color="textPrimary"
          style={{ fontWeight: "900" }}
        >
          Item {activeIndex + 1}/{total}
        </MText>

        <View style={styles.dots}>
          {Array.from({ length: dotCount }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === dotActive
                      ? colors.primary
                      : colors.backgroundSecondary,
                  opacity: i === dotActive ? 1 : 0.85,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.chipsRow}>
        <Chip label={`Done ${counts.done}`} />
        <Chip label={`Active ${counts.active}`} />
        <Chip label={`Queued ${counts.pending}`} />
      </View>
    </View>
  );
}

function Chip({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.chip, { backgroundColor: colors.backgroundSecondary }]}
    >
      <MText
        variant="caption"
        color="textPrimary"
        style={{ opacity: 0.85, fontWeight: "800" }}
      >
        {label}
      </MText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    maxWidth: "95%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dots: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 999 },
  chipsRow: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
