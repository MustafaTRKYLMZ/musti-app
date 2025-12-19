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
import type { ReadingTarget } from "@/store/bookshelf/useReadingTargetsStore";

const { colors } = bookshelfTheme;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

type Props = {
  target: ReadingTarget;
  currentPage: number;
  onOpen: (t: ReadingTarget, openPage: number) => void;
  onDelete: (t: ReadingTarget) => void;
  onAutoDone: (id: string) => void;
  onRestart?: (t: ReadingTarget) => void;
};

export function TargetCard({
  target,
  currentPage,
  onOpen,
  onDelete,
  onAutoDone,
  onRestart,
}: Props) {
  // ✅ baseline for this "run"
  const baseStart =
    target.status === "active"
      ? (target as any).activeFromPage ??
        target.jumpPage ??
        target.startPage ??
        1
      : target.jumpPage ?? target.startPage ?? 1;

  const rangeStart = Math.max(1, Math.floor(baseStart));
  const rangeEnd = Math.max(
    rangeStart,
    Math.floor(target.endPage ?? rangeStart)
  );

  const total = Math.max(1, rangeEnd - rangeStart + 1);

  // ✅ normalize current page
  const rawCurrent = Number.isFinite(Number(currentPage))
    ? Math.floor(Number(currentPage))
    : 0;

  // ✅ if book progress already past the target end while target is active (common after restart),
  // treat as "not started" for display + open behavior.
  const isPastEnd = target.status === "active" && rawCurrent > rangeEnd;

  // ✅ progress math uses clamped current page (not openPage)
  const clampedCurrent = clamp(rawCurrent || rangeStart, rangeStart, rangeEnd);

  const openPage = isPastEnd ? rangeStart : clampedCurrent;

  // ✅ show 0 progress when "past end" so remaining isn't 0 after restart
  const donePages = isPastEnd
    ? 0
    : Math.max(0, clampedCurrent - rangeStart + 1);
  const remainingPages = Math.max(0, total - donePages);
  const pct = clamp01(donePages / total);

  // ✅ auto-done only when user crosses end during reading (prevents instant re-done)
  const prevPageRef = useRef<number>(rawCurrent || 0);

  useEffect(() => {
    // reset when target/run baseline changes
    prevPageRef.current = rangeStart;
  }, [target.id, rangeStart]);

  useEffect(() => {
    if (target.status !== "active") return;

    const prev = prevPageRef.current || 0;
    const curr = rawCurrent || 0;

    const crossedEnd = prev < rangeEnd && curr >= rangeEnd;
    if (crossedEnd) onAutoDone(target.id);

    prevPageRef.current = curr;
  }, [target.status, rawCurrent, rangeEnd, onAutoDone, target.id]);

  const subtitle = useMemo(() => {
    return `${target.label} • ${rangeStart}–${rangeEnd}`;
  }, [target.label, rangeStart, rangeEnd]);

  const openMenu = () => {
    const buttons: any[] = [{ text: "Cancel", style: "cancel" as const }];

    if (target.status === "done" && onRestart) {
      buttons.push({
        text: "Restart",
        onPress: () => onRestart(target),
      });
    }

    buttons.push({
      text: "Delete",
      style: "destructive" as const,
      onPress: () => onDelete(target),
    });

    Alert.alert("Target", target.label, buttons);
  };

  return (
    <Pressable onPress={() => onOpen(target, openPage)} style={styles.card}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <MText numberOfLines={1} style={styles.title}>
            {target.bookName}
          </MText>
          <MText numberOfLines={1} style={styles.sub}>
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
          {donePages} / {total} pages
        </MText>
        <MText style={styles.progressText}>Remaining: {remainingPages}</MText>
      </View>

      <View style={[styles.bottomRow, { marginTop: spacing.xs }]}>
        <MText style={styles.progressText}>Current: {rawCurrent}</MText>
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
  title: { fontWeight: "800" },
  sub: { marginTop: spacing.xs, opacity: 0.75 },

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
  progressText: { opacity: 0.75, fontWeight: "700" },
});
