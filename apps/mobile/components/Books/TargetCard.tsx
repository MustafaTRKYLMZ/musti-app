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
  progressMap: Record<string, any>;

  onOpen: (t: ReadingTarget, item: TargetItem, openPage: number) => void;
  onDelete: (t: ReadingTarget) => void;

  onAutoDoneItem: (targetId: string, itemId: string) => void;

  onRestart?: (t: ReadingTarget) => void;
};

function getCurrentPage(progressMap: Record<string, any>, bookUri: string) {
  const v = progressMap?.[bookUri]?.lastPage ?? 0;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function pickDisplayItem(t: ReadingTarget): TargetItem | null {
  const items = t.items ?? [];
  const active = items.find((it) => it.status === "active");
  if (active) return active;

  const pending = items.find((it) => it.status === "pending");
  if (pending) return pending;

  return items[items.length - 1] ?? null;
}

export function TargetCard({
  target,
  progressMap,
  onOpen,
  onDelete,
  onAutoDoneItem,
  onRestart,
}: Props) {
  const displayItem = useMemo(() => pickDisplayItem(target), [target]);

  const currentPage = useMemo(() => {
    if (!displayItem) return 0;
    return getCurrentPage(progressMap, displayItem.bookUri);
  }, [progressMap, displayItem]);

  const rangeStart = useMemo(() => {
    if (!displayItem) return 1;
    const base =
      displayItem.status === "active"
        ? displayItem.activeFromPage ??
          displayItem.jumpPage ??
          displayItem.startPage ??
          1
        : displayItem.jumpPage ?? displayItem.startPage ?? 1;

    return Math.max(1, Math.floor(base));
  }, [displayItem]);

  const rangeEnd = useMemo(() => {
    if (!displayItem) return rangeStart;
    return Math.max(rangeStart, Math.floor(displayItem.endPage ?? rangeStart));
  }, [displayItem, rangeStart]);

  const total = Math.max(1, rangeEnd - rangeStart + 1);

  const rawCurrent = Number.isFinite(Number(currentPage))
    ? Math.floor(Number(currentPage))
    : 0;

  // restart sonrası book progress end'in ilerisindeyse progress 0 göster
  const isPastEnd = displayItem?.status === "active" && rawCurrent > rangeEnd;

  const clampedCurrent = clamp(rawCurrent || rangeStart, rangeStart, rangeEnd);
  const openPage = isPastEnd ? rangeStart : clampedCurrent;

  const donePages = isPastEnd
    ? 0
    : Math.max(0, clampedCurrent - rangeStart + 1);
  const remainingPages = Math.max(0, total - donePages);
  const pct = clamp01(donePages / total);

  // crossing detection (yalnız aktif item)
  const prevRef = useRef<number>(rangeStart);

  useEffect(() => {
    prevRef.current = rangeStart;
  }, [target.id, displayItem?.id, rangeStart]);

  useEffect(() => {
    if (!displayItem) return;
    if (displayItem.status !== "active") return;
    if (isPastEnd) return;

    const prev = prevRef.current || 0;
    const curr = rawCurrent || 0;

    const crossedEnd = prev < rangeEnd && curr >= rangeEnd;
    if (crossedEnd) onAutoDoneItem(target.id, displayItem.id);

    prevRef.current = curr;
  }, [target.id, displayItem, rawCurrent, rangeEnd, isPastEnd, onAutoDoneItem]);

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
