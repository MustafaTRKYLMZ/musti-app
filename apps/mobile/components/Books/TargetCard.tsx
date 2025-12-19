import React, { useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { MText, iconSizes, spacing, radii, useTheme } from "@budget/ui-native";
import { IconButton } from "@/components/ui/AppIcon";
import type {
  ReadingTarget,
  TargetItem,
} from "@/store/bookshelf/useReadingTargetsStore";

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
  const { colors } = useTheme();

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

  // auto done only for active item when cursor crosses end
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

  // --- status colors from theme (fallback if you haven't added them yet) ---
  const statusActive = (colors as any).statusActive ?? colors.success;
  const statusDone = (colors as any).statusDone ?? colors.textMuted;
  const statusPending = (colors as any).primaryLight ?? colors.warning;

  return (
    <Pressable
      onPress={() => onOpen(target, displayItem, openPage)}
      style={[
        styles.card,
        {
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.targetCardHeader}>
            <MText
              numberOfLines={1}
              style={[styles.title, { color: colors.textPrimary }]}
            >
              {target.title}
            </MText>
            <IconButton
              name="ellipsis-vertical"
              size={iconSizes.lg}
              color={colors.textPrimary}
              onPress={openMenu}
            />
          </View>
          <MText
            numberOfLines={1}
            style={[styles.sub, { color: colors.textPrimary, opacity: 0.9 }]}
          >
            {displayItem.bookName}
          </MText>

          <MText
            numberOfLines={1}
            style={[styles.sub, { color: colors.textPrimary, opacity: 0.75 }]}
          >
            {subtitle}
          </MText>
        </View>
      </View>
      <View
        style={[
          styles.barWrap,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <View
          style={[
            styles.barFill,
            { width: `${pct * 100}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>
      <View style={styles.bottomRow}>
        <MText
          style={[
            styles.progressText,
            { color: colors.textPrimary, opacity: 0.75 },
          ]}
        >
          {donePages} / {total}
        </MText>
        <MText
          style={[
            styles.progressText,
            { color: colors.textPrimary, opacity: 0.75 },
          ]}
        >
          Remaining: {remainingPages}
        </MText>
      </View>
      <View style={styles.dotContainer}>
        <ItemDots
          items={target.items}
          activeColor={statusActive}
          doneColor={statusDone}
          pendingColor={statusPending}
          maxDots={10}
        />
      </View>
    </Pressable>
  );
}

function ItemDots({
  items,
  activeColor,
  doneColor,
  pendingColor,
  maxDots = 10,
}: {
  items: { id: string; status: "done" | "active" | "pending" }[];
  activeColor: string;
  doneColor: string;
  pendingColor: string;
  maxDots?: number;
}) {
  const { colors } = useTheme();

  const total = items.length;
  const shown = Math.min(total, maxDots);
  const extra = total - shown;

  return (
    <View style={styles.dotsRow}>
      {items.slice(0, shown).map((it) => {
        const key = it.id;

        if (it.status === "done") {
          return (
            <View
              key={key}
              style={[styles.dotFilled, { backgroundColor: doneColor }]}
            />
          );
        }

        if (it.status === "active") {
          // ✅ active: bigger + ring
          return (
            <View
              key={key}
              style={[
                styles.dotActiveWrap,
                { borderColor: activeColor + "55" }, // ring (hex alpha)
              ]}
            >
              <View
                style={[
                  styles.dotActiveInner,
                  { backgroundColor: activeColor },
                ]}
              />
            </View>
          );
        }

        return (
          <View
            key={key}
            style={[
              styles.dotPending,
              {
                borderColor: pendingColor,
                backgroundColor: pendingColor + "33",
                opacity: 1,
              },
            ]}
          />
        );
      })}

      {extra > 0 && (
        <MText style={[styles.extraText, { color: colors.textSecondary }]}>
          +{extra}
        </MText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 320,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  targetCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { fontWeight: "900" },
  sub: { marginTop: spacing.xs },

  itemsRow: {
    marginTop: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  itemsText: { fontWeight: "900", opacity: 0.9 },

  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  dotFilled: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  dotOutline: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 2,
  },
  extraText: {
    fontWeight: "900",
    opacity: 0.85,
    marginLeft: 2,
  },

  barWrap: {
    marginTop: spacing.md,
    height: 8,
    borderRadius: radii.full,
    overflow: "hidden",
  },
  barFill: { height: "100%" },

  bottomRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: { fontWeight: "800" },
  dotActiveWrap: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dotActiveInner: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  dotPending: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 2.5,
  },
  dotContainer: {
    padding: spacing.xs,
  },
});
