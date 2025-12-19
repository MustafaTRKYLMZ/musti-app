import React, { useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import {
  MText,
  bookshelfTheme,
  iconSizes,
  spacing,
  radii,
} from "@budget/ui-native";
import { IconButton } from "@/components/ui/AppIcon";
import type {
  ReadingTarget,
  TargetItem,
} from "@/store/bookshelf/useReadingTargetsStore";

const { colors } = bookshelfTheme;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

type Props = {
  target: ReadingTarget;

  onOpen: (t: ReadingTarget, item: TargetItem, openPage: number) => void;
  onDelete: (t: ReadingTarget) => void;

  onAutoDoneItem: (targetId: string, itemId: string) => void;
  onRestart?: (t: ReadingTarget) => void;
};

function pickActiveItem(t: ReadingTarget): TargetItem | null {
  return t.items?.find((it) => it.status === "active") ?? null;
}

export function TargetCard({
  target,
  onOpen,
  onDelete,
  onAutoDoneItem,
  onRestart,
}: Props) {
  const activeItem = useMemo(() => pickActiveItem(target), [target]);
  const displayItem =
    activeItem ?? target.items[target.items.length - 1] ?? null;

  const rangeStart = useMemo(() => {
    if (!displayItem) return 1;
    return Math.max(
      1,
      Math.floor(
        displayItem.activeFromPage ??
          displayItem.jumpPage ??
          displayItem.startPage ??
          1
      )
    );
  }, [displayItem]);

  const rangeEnd = useMemo(() => {
    if (!displayItem) return rangeStart;
    return Math.max(rangeStart, Math.floor(displayItem.endPage ?? rangeStart));
  }, [displayItem, rangeStart]);

  const total = Math.max(1, rangeEnd - rangeStart + 1);

  // ✅ target cursor
  const rawCurrent = useMemo(() => {
    if (!displayItem) return rangeStart;
    const c = Number(displayItem.cursorPage ?? rangeStart);
    return Number.isFinite(c) ? Math.floor(c) : rangeStart;
  }, [displayItem, rangeStart]);

  const clampedCurrent = clamp(rawCurrent, rangeStart, rangeEnd);
  const openPage = clampedCurrent;

  const donePages = Math.max(0, clampedCurrent - rangeStart + 1);
  const remainingPages = Math.max(0, total - donePages);
  const pct = clamp01(donePages / total);

  // ✅ auto done only for active item when cursor crosses end
  const prevRef = useRef<number>(rangeStart);

  useEffect(() => {
    prevRef.current = rangeStart;
  }, [target.id, displayItem?.id, rangeStart]);

  useEffect(() => {
    if (!displayItem) return;
    if (displayItem.status !== "active") return;

    const prev = prevRef.current || 0;
    const curr = clampedCurrent || 0;

    if (prev < rangeEnd && curr >= rangeEnd) {
      onAutoDoneItem(target.id, displayItem.id);
    }

    prevRef.current = curr;
  }, [target.id, displayItem, clampedCurrent, rangeEnd, onAutoDoneItem]);

  const subtitle = useMemo(() => {
    if (!displayItem) return "";
    return `${displayItem.label} • ${rangeStart}–${rangeEnd}`;
  }, [displayItem, rangeStart, rangeEnd]);

  const openMenu = () => {
    const buttons: any[] = [{ text: "Cancel", style: "cancel" as const }];

    if (target.status === "done" && onRestart) {
      buttons.push({ text: "Restart", onPress: () => onRestart(target) });
    }

    buttons.push({
      text: "Delete",
      style: "destructive" as const,
      onPress: () => onDelete(target),
    });

    Alert.alert("Target", target.title, buttons);
  };

  if (!displayItem) return null;

  return (
    <Pressable
      onPress={() => onOpen(target, displayItem, openPage)}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <MText numberOfLines={1} style={styles.title}>
            {target.title}
          </MText>
          <MText numberOfLines={1} style={styles.sub}>
            {displayItem.bookName}
          </MText>
          <MText numberOfLines={1} style={[styles.sub, { opacity: 0.75 }]}>
            {subtitle}
          </MText>
        </View>

        <IconButton
          name="ellipsis-horizontal"
          size={iconSizes.lg}
          color={colors.textPrimary}
          onPress={openMenu}
        />
      </View>

      <View style={styles.barWrap}>
        <View style={[styles.barFill, { width: `${pct * 100}%` }]} />
      </View>

      <View style={styles.bottomRow}>
        <MText style={styles.progressText}>
          {donePages} / {total}
        </MText>
        <MText style={styles.progressText}>Remaining: {remainingPages}</MText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 320,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { fontWeight: "900" },
  sub: { marginTop: spacing.xs, opacity: 0.9 },

  barWrap: {
    marginTop: spacing.md,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.backgroundSecondary,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: colors.primary },

  bottomRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: { opacity: 0.75, fontWeight: "800" },
});
