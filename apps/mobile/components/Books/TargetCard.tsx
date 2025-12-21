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
import { MText, iconSizes, spacing, radii, useTheme } from "@budget/ui-native";
import { IconButton, BaseIcon } from "@/components/ui/AppIcon";
import type {
  ReadingTarget,
  TargetItem,
} from "@/store/bookshelf/useReadingTargetsStore";
import { ItemDots } from "../ui/ItemDots";
import { pickActiveItem } from "@/utils/pickActiveItem";
import { useToast } from "../ui/ToastProvider";
import { TargetItemSummary } from "./TargetItemSummary";
import { MenuRow } from "../MenuRow";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

type Props = {
  target: ReadingTarget;

  // ✅ already computed in TargetList
  todayPages?: number;

  disableOpen?: boolean;
  onOpen: (t: ReadingTarget, item: TargetItem, openPage: number) => void;
  onDelete: (t: ReadingTarget) => void;

  onAutoDoneItem: (targetId: string, itemId: string) => void;
  onRestart?: (t: ReadingTarget) => void;
  onBeforeOpen?: (targetId: string, itemId: string) => Promise<void> | void;

  onEditTarget?: (t: ReadingTarget) => void;
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
}: Props) => {
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

  // ✅ keep popover inside screen
  const MENU_W = 180;
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
      title: "Delete target?",
      message: target.title,
      actions: [
        { label: "Cancel", onPress: () => {} },
        { label: "Delete", destructive: true, onPress: () => onDelete(target) },
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
      title: "Restart target?",
      message: target.title,
      actions: [
        { label: "Cancel", onPress: () => {} },
        {
          label: "Restart",
          onPress: () => onRestart?.(target),
          destructive: false,
        },
      ],
      duration: 6000,
    });
  };

  useEffect(() => {
    const idx = activeItem
      ? target.items.findIndex((i) => i.id === activeItem.id)
      : -1;
    setPreviewIndex(idx >= 0 ? idx : 0);
  }, [target.id]); // intentionally only on target change

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

  const statusActive = colors.success;
  const statusPending = colors.primaryLight;
  const statusDone = colors.textMuted;

  const handleOpen = async () => {
    if (!displayItem) return;

    const shouldChangeActive = activeItem?.id !== displayItem.id;

    try {
      if (shouldChangeActive) {
        await onBeforeOpen?.(target.id, displayItem.id);
      }
    } catch {
      showToast("Failed to open target item.");
      return;
    }

    onOpen(target, displayItem, openPage);
  };

  const todayPagesSafe = Number.isFinite(todayPages as number)
    ? Math.max(0, Math.floor(todayPages as number))
    : 0;

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
          <View style={styles.targetCardHeader}>
            <MText
              numberOfLines={1}
              style={[styles.title, { color: colors.textPrimary }]}
            >
              {target.title}
            </MText>

            <View ref={menuAnchorRef} collapsable={false}>
              <IconButton
                name="ellipsis-vertical"
                size={iconSizes.lg}
                color={colors.textPrimary}
                onPress={openMenu}
              />
            </View>
          </View>

          <MText
            style={{
              marginTop: spacing.sm,
              color: colors.textSecondary,
              opacity: 0.85,
            }}
          >
            No items yet
          </MText>
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
              {!!onRestart && isDoneTarget && (
                <MenuRow
                  icon="refresh-outline"
                  label="Restart"
                  color={colors.textPrimary}
                  onPress={handleReStart}
                />
              )}

              {!!onEditTarget && !isDoneTarget && (
                <MenuRow
                  icon="create-outline"
                  label="Edit"
                  color={colors.textPrimary}
                  onPress={handleEdit}
                />
              )}

              <MenuRow
                icon="trash-outline"
                label="Delete"
                color={colors.danger}
                onPress={confirmDelete}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  }

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
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.targetCardHeader}>
              <MText
                numberOfLines={1}
                style={[styles.title, { color: colors.textPrimary }]}
              >
                {target.title}
              </MText>

              <View ref={menuAnchorRef} collapsable={false}>
                <IconButton
                  name="ellipsis-vertical"
                  size={iconSizes.lg}
                  color={colors.textPrimary}
                  onPress={openMenu}
                />
              </View>
            </View>

            <Animated.View
              style={{
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

        {/* ✅ Today stats: dots’un hemen üstü */}
        <View style={styles.todayRow}>
          {/* if calendar-outline not available, change to time-outline */}
          <BaseIcon
            name="calendar-outline"
            size={12}
            color={colors.textSecondary}
          />
          <MText variant="caption" color="textSecondary">
            Today: {todayPagesSafe} pages
          </MText>
        </View>

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
            {!!onRestart && isDoneTarget && (
              <MenuRow
                icon="refresh-outline"
                label="Restart"
                color={colors.textPrimary}
                onPress={handleReStart}
              />
            )}

            {!!onEditTarget && !isDoneTarget && (
              <MenuRow
                icon="create-outline"
                label="Edit"
                color={colors.textPrimary}
                onPress={handleEdit}
              />
            )}

            <MenuRow
              icon="trash-outline"
              label="Delete"
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

  // ✅ today row right above dots
  todayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    opacity: 0.8,
  },

  dotContainer: { padding: spacing.xs },

  menuOverlay: { flex: 1, backgroundColor: "transparent" },
  popover: {
    position: "absolute",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    width: 180,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  menuItem: {
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
