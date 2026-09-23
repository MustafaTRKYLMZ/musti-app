import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  PanResponder,
  Animated,
  Modal,
  TouchableOpacity,
  UIManager,
  findNodeHandle,
  Dimensions,
} from "react-native";
import { MText, iconSizes, spacing, radii, useTheme } from "@musti/ui-native";
import { IconButton, BaseIcon } from "@musti/ui-native";
import { ItemDots } from "../ui/ItemDots";
import { pickActiveItem } from "@/utils/pickActiveItem";
import { useToast } from "../ui/ToastProvider";
import { TargetItemSummary } from "./TargetItemSummary";
import { MenuRow } from "../ui/MenuRow";
import {
  useTranslation,
  formatTranslation,
  type ReadingTarget,
  type TargetItem,
  type TargetRepeatEnd,
} from "@musti/core";
import { RemainingTimeBadge } from "../ui/pdf/RemainingTimeBadge";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

type Props = {
  target: ReadingTarget;

  todayPages?: number;
  todayMinutes?: number;

  disableOpen?: boolean;
  onOpen: (t: ReadingTarget, item: TargetItem, openPage: number) => void;
  onDelete: (t: ReadingTarget) => void;

  onAutoDoneItem: (targetId: string, itemId: string) => void;
  onRestart?: (t: ReadingTarget) => void;
  onBeforeOpen?: (targetId: string, itemId: string) => Promise<void> | void;

  onEditTarget?: (t: ReadingTarget) => void;

  // repeat
  repeatEnabled?: boolean;
  cycleCompleted?: boolean;
  nextResetText?: string | null;
  onSkipCycle?: (t: ReadingTarget) => Promise<void> | void;
};

const FALLBACK_ITEM: TargetItem = {
  id: "__fallback__",
  bookUri: "",
  bookName: "",
  type: "pages",
  startPage: 1,
  endPage: 1,
  jumpPage: 1,
  labelId: "",
  label: "",
  activeFromPage: 1,
  cursorPage: 1,
  status: "pending",
};

function getCycleBadgeText(
  end?: TargetRepeatEnd,
  t?: (key: import("@musti/core").TranslationKey) => string
): string | null {
  const infinite = t?.("bookshelf.target.cycleInfinite") ?? "Cycle: ∞";
  if (!end) return infinite;
  if (end.kind === "never") return infinite;
  if (end.kind === "until") return infinite;

  if (end.kind === "count") {
    const anyEnd = end as any;

    // new: total + remaining, old: remaining only
    const total = Math.max(
      1,
      Math.floor(Number(anyEnd.total ?? anyEnd.remaining ?? 1) || 1)
    );
    const remaining = Math.max(
      0,
      Math.floor(Number(anyEnd.remaining ?? total) || 0)
    );

    // cycle index: total-remaining + 1  (clamped)
    const idx = Math.max(1, Math.min(total, total - remaining + 1));
    const template =
      t?.("bookshelf.target.cycleProgress") ?? "Cycle: {{current}}/{{total}}";
    return formatTranslation(template, { current: idx, total });
  }

  return null;
}

export const TargetCard = ({
  target,
  onOpen,
  onDelete,
  onAutoDoneItem,
  onRestart,
  onBeforeOpen,
  onEditTarget,
  disableOpen,
  todayPages,
  todayMinutes,

  repeatEnabled,
  cycleCompleted,
  nextResetText,
  onSkipCycle,
}: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();

  const activeItem = useMemo(() => pickActiveItem(target), [target]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const menuAnchorRef = useRef<View | null>(null);

  const isDoneTarget = target.status === "done";

  const MENU_W = 200;
  const SAFE_PAD = 8;

  const openMenu = () => {
    const handle = findNodeHandle(menuAnchorRef.current);
    if (!handle) return;

    UIManager.measure(handle, (_x, _y, width, height, pageX, pageY) => {
      const windowW = Dimensions.get("window").width;

      let x = pageX + width - MENU_W;
      x = Math.max(SAFE_PAD, Math.min(x, windowW - MENU_W - SAFE_PAD));

      const y = pageY + height + 8;

      setMenuPos({ x, y });
      setMenuVisible(true);
    });
  };

  const closeMenu = () => setMenuVisible(false);

  const confirmDelete = () => {
    closeMenu();
    showToast({
      title: t("bookshelf.target.deleteConfirm"),
      message: target.title,
      actions: [
        { label: t("cancel"), onPress: () => {} },
        {
          label: t("delete"),
          destructive: true,
          onPress: () => onDelete(target),
        },
      ],
      duration: 6000,
    });
  };

  const handleEdit = () => {
    closeMenu();
    onEditTarget?.(target);
  };

  const handleReStart = () => {
    closeMenu();
    showToast({
      title: t("bookshelf.target.restartConfirm"),
      message: target.title,
      actions: [
        { label: t("cancel"), onPress: () => {} },
        {
          label: t("bookshelf.common.restart"),
          onPress: () => onRestart?.(target),
        },
      ],
      duration: 6000,
    });
  };

  const handleSkipCycle = async () => {
    closeMenu();
    try {
      await onSkipCycle?.(target);
      try {
        showToast({
          message: t("bookshelf.target.movedNextCycle"),
          duration: 1800,
        } as any);
      } catch {
        showToast(t("bookshelf.target.movedNextCycle") as any);
      }
    } catch {
      try {
        showToast({
          message: t("bookshelf.target.skipCycleFailed"),
          duration: 3000,
        } as any);
      } catch {
        showToast(t("bookshelf.target.skipCycleFailed") as any);
      }
    }
  };

  useEffect(() => {
    const idx = activeItem
      ? target.items.findIndex((i) => i.id === activeItem.id)
      : -1;
    setPreviewIndex(idx >= 0 ? idx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.id]);

  const displayItem = useMemo(() => {
    if (!target.items.length) return null;
    const i = Math.max(0, Math.min(target.items.length - 1, previewIndex));
    return target.items[i] ?? null;
  }, [target.items, previewIndex]);

  const safeDisplayItem = displayItem ?? FALLBACK_ITEM;

  const anim = useRef(new Animated.Value(1)).current;
  const lastItemIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!displayItem) return;

    const id = displayItem.id;
    if (lastItemIdRef.current === null) {
      lastItemIdRef.current = id;
      return;
    }
    if (lastItemIdRef.current === id) return;

    lastItemIdRef.current = id;

    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [displayItem?.id, displayItem, anim]);

  const swipeThreshold = 18;
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 6,
        onPanResponderRelease: (_, g) => {
          if (!target.items.length) return;

          if (g.dx <= -swipeThreshold) {
            setPreviewIndex((i) => Math.min(target.items.length - 1, i + 1));
          } else if (g.dx >= swipeThreshold) {
            setPreviewIndex((i) => Math.max(0, i - 1));
          }
        },
      }),
    [target.items.length]
  );

  const rangeStart = useMemo(() => {
    return Math.max(
      1,
      Math.floor(
        safeDisplayItem.activeFromPage ??
          safeDisplayItem.jumpPage ??
          safeDisplayItem.startPage ??
          1
      )
    );
  }, [
    safeDisplayItem.activeFromPage,
    safeDisplayItem.jumpPage,
    safeDisplayItem.startPage,
  ]);

  const rangeEnd = useMemo(() => {
    return Math.max(
      rangeStart,
      Math.floor(safeDisplayItem.endPage ?? rangeStart)
    );
  }, [safeDisplayItem.endPage, rangeStart]);

  const total = Math.max(1, rangeEnd - rangeStart + 1);

  const rawCurrent = useMemo(() => {
    const c = Number(safeDisplayItem.cursorPage ?? rangeStart);
    return Number.isFinite(c) ? Math.floor(c) : rangeStart;
  }, [safeDisplayItem.cursorPage, rangeStart]);

  const clampedCurrent = clamp(rawCurrent, rangeStart, rangeEnd);
  const openPage = clampedCurrent;

  const donePages = Math.max(0, clampedCurrent - rangeStart + 1);
  const remainingPages = Math.max(0, total - donePages);
  const pct = clamp01(donePages / total);

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

  const handleOpen = async () => {
    if (!displayItem) return;

    const shouldChangeActive = activeItem?.id !== displayItem.id;

    try {
      if (shouldChangeActive) {
        await onBeforeOpen?.(target.id, displayItem.id);
      }
    } catch {
      showToast(t("bookshelf.target.openFailed") as any);
      return;
    }

    onOpen(target, displayItem, openPage);
  };

  const todayPagesSafe = Number.isFinite(todayPages as number)
    ? Math.max(0, Math.floor(todayPages as number))
    : 0;

  const todayMinutesSafe = Number.isFinite(todayMinutes as number)
    ? Math.max(0, Math.floor(todayMinutes as number))
    : 0;

  const todayLabel = formatTranslation(t("bookshelf.common.todayPagesMin"), {
    pages: todayPagesSafe,
    minutes: todayMinutesSafe,
  });

  const showRepeat = Boolean(repeatEnabled ?? target.repeat);
  const effectiveCycleCompleted = Boolean(
    cycleCompleted ?? (target as any).cycleCompletedAt
  );

  const repeatLine1 =
    showRepeat && effectiveCycleCompleted
      ? t("bookshelf.target.completed")
      : null;
  const repeatLine2 =
    showRepeat && nextResetText
      ? formatTranslation(t("bookshelf.target.resets"), {
          when: nextResetText,
        })
      : null;

  const cycleBadge = showRepeat
    ? getCycleBadgeText((target.repeat as any)?.end, t)
    : null;

  const canSkip =
    Boolean(onSkipCycle) && Boolean(target.repeat) && !isDoneTarget;

  if (!target.items.length || !displayItem) {
    return (
      <>
        <View
          style={[
            styles.card,
            {
              borderColor: colors.borderSubtle,
              backgroundColor: colors.surface,
              opacity: 0.7,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <MText
              numberOfLines={1}
              style={[styles.title, { color: colors.textPrimary }]}
            >
              {target.title}
            </MText>

            <View ref={menuAnchorRef} collapsable={false}>
              <IconButton
                name="ellipsis-vertical"
                color={colors.textPrimary}
                onPress={openMenu}
              />
            </View>
          </View>

          {showRepeat ? (
            <View style={{ marginTop: spacing.xs }}>
              {repeatLine1 ? (
                <MText style={{ fontWeight: "900", color: colors.textPrimary }}>
                  {repeatLine1}
                </MText>
              ) : null}

              {cycleBadge ? (
                <MText style={{ opacity: 0.8, color: colors.textSecondary }}>
                  {cycleBadge}
                </MText>
              ) : null}

              {repeatLine2 ? (
                <MText style={{ opacity: 0.75, color: colors.textSecondary }}>
                  {repeatLine2}
                </MText>
              ) : null}
            </View>
          ) : null}

          <MText
            style={{
              marginTop: spacing.sm,
              color: colors.textSecondary,
              opacity: 0.85,
            }}
          >
            {t("bookshelf.target.noItems")}
          </MText>

          <View style={styles.todayRow}>
            <BaseIcon
              name="time-outline"
              size={12}
              color={colors.textSecondary}
            />
            <MText variant="caption" color="textSecondary">
              {todayLabel}
            </MText>
          </View>
        </View>

        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={closeMenu}
        >
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={closeMenu}
          >
            <View
              style={[
                styles.popover,
                {
                  top: menuPos.y,
                  left: menuPos.x,
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              {canSkip ? (
                <MenuRow
                  icon="play-forward-outline"
                  label={t("bookshelf.target.skipCycle")}
                  color={colors.textPrimary}
                  onPress={handleSkipCycle}
                />
              ) : null}

              {!!onRestart && isDoneTarget && (
                <MenuRow
                  icon="refresh-outline"
                  label={t("bookshelf.common.restart")}
                  color={colors.textPrimary}
                  onPress={handleReStart}
                />
              )}

              {!!onEditTarget && !isDoneTarget && (
                <MenuRow
                  icon="create-outline"
                  label={t("edit")}
                  color={colors.textPrimary}
                  onPress={handleEdit}
                />
              )}

              <MenuRow
                icon="trash-outline"
                label={t("delete")}
                color={colors.danger}
                onPress={confirmDelete}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  }

  const statusActive = colors.success;
  const statusPending = colors.primaryLight;
  const statusDone = colors.textMuted;

  return (
    <>
      <Pressable
        onPress={disableOpen ? undefined : handleOpen}
        disabled={!!disableOpen}
        style={[
          styles.card,
          { borderColor: colors.borderSubtle, backgroundColor: colors.surface },
          disableOpen && { opacity: 0.92 },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <MText
              numberOfLines={1}
              style={[styles.title, { color: colors.textPrimary }]}
            >
              {target.title}
            </MText>

            {showRepeat ? (
              <View style={{ marginTop: spacing.xs }}>
                {repeatLine1 ? (
                  <MText
                    style={{ fontWeight: "900", color: colors.textPrimary }}
                  >
                    {repeatLine1}
                  </MText>
                ) : null}

                {cycleBadge ? (
                  <MText style={{ opacity: 0.8, color: colors.textSecondary }}>
                    {cycleBadge}
                  </MText>
                ) : null}

                {repeatLine2 ? (
                  <MText style={{ opacity: 0.75, color: colors.textSecondary }}>
                    {repeatLine2}
                  </MText>
                ) : null}
              </View>
            ) : null}

            <Animated.View
              style={{
                marginTop: spacing.xs,
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [3, 0],
                    }),
                  },
                ],
              }}
            >
              <TargetItemSummary item={displayItem} />
            </Animated.View>
          </View>

          <View
            ref={menuAnchorRef}
            collapsable={false}
            style={{ marginLeft: spacing.sm }}
          >
            <IconButton
              name="ellipsis-vertical"
              color={colors.textPrimary}
              onPress={openMenu}
            />
          </View>
        </View>

        {/* Progress bar */}
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

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statsLeft}>
            <MText
              style={[
                styles.statText,
                { color: colors.textPrimary, opacity: 0.78 },
              ]}
            >
              {donePages} / {total}
            </MText>
            <MText
              style={[
                styles.statText,
                { color: colors.textPrimary, opacity: 0.78 },
              ]}
            >
              {formatTranslation(t("bookshelf.target.remaining"), {
                count: remainingPages,
              })}
            </MText>
          </View>

          <View style={styles.statsRight}>
            <RemainingTimeBadge
              paceKey={displayItem.bookUri ?? null}
              remainingPages={remainingPages}
            />
          </View>
        </View>

        {/* Today line */}
        <View style={styles.todayRow}>
          <BaseIcon
            name="time-outline"
            size={12}
            color={colors.textSecondary}
          />
          <MText variant="caption" color="textSecondary">
            {todayLabel}
          </MText>
        </View>

        {/* Dots */}
        <View style={styles.dotContainer} {...panResponder.panHandlers}>
          <ItemDots
            items={target.items}
            activeColor={statusActive}
            doneColor={statusDone}
            pendingColor={statusPending}
            maxDots={10}
            selectedIndex={previewIndex}
            onSelectIndex={setPreviewIndex}
          />
        </View>
      </Pressable>

      {/* Menu */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={closeMenu}
        >
          <View
            style={[
              styles.popover,
              {
                top: menuPos.y,
                left: menuPos.x,
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            {canSkip ? (
              <MenuRow
                icon="play-forward-outline"
                label={t("bookshelf.target.skipCycle")}
                color={colors.textPrimary}
                onPress={handleSkipCycle}
              />
            ) : null}

            {!!onRestart && isDoneTarget && (
              <MenuRow
                icon="refresh-outline"
                label={t("bookshelf.common.restart")}
                color={colors.textPrimary}
                onPress={handleReStart}
              />
            )}

            {!!onEditTarget && !isDoneTarget && (
              <MenuRow
                icon="create-outline"
                label={t("edit")}
                color={colors.textPrimary}
                onPress={handleEdit}
              />
            )}

            <MenuRow
              icon="trash-outline"
              label={t("delete")}
              color={colors.danger}
              onPress={confirmDelete}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 320,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  title: {
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.1,
  },

  barWrap: {
    marginTop: spacing.md,
    height: 8,
    borderRadius: radii.full,
    overflow: "hidden",
  },
  barFill: { height: "100%" },

  statsRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  statsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flexWrap: "wrap",
    flex: 1,
  },
  statsRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  statText: {
    fontWeight: "800",
  },

  todayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
    opacity: 0.75,
  },

  dotContainer: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },

  menuOverlay: { flex: 1, backgroundColor: "transparent" },
  popover: {
    position: "absolute",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    width: 200,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
});
