import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Modal,
  UIManager,
  findNodeHandle,
  StyleProp,
  ViewStyle,
  Dimensions,
  PanResponder,
} from "react-native";
import {
  MText,
  spacing,
  radii,
  iconSizes,
  useTheme,
  Card,
} from "@budget/ui-native";
import { BaseIcon, IconButton } from "@/components/ui/AppIcon";
import { ProgressPill, getProgressColor } from "@/components/ui/ProgressPill";
import { RemainingTimeBadge } from "../ui/pdf/RemainingTimeBadge";
import { ItemDots } from "../ui/ItemDots";

export type PlanInfo = {
  name: string;
  isCompleted: boolean;
  totalCompleted: number; // pages today
  totalPagesInPlan: number; // pages target today
  currentBookName?: string;
  currentBookUri?: string;
  remainingInItem?: number;
  suggestedBookName?: string;
  todayMinutes?: number;
};

type PlanItem = {
  bookUri: string;
  pagesPerDay: number;
  bookName?: string;
};

type PlanCardProps = {
  planId: string;
  currentPlanInfo: PlanInfo | null;
  onPress: () => void;
  onDeletePlan: () => void;
  onEditPlan?: () => void;
  wrapperStyle?: StyleProp<ViewStyle>;
  cardStyle?: StyleProp<ViewStyle>;
  planItems?: PlanItem[];
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function prettyNameFromUri(uri?: string) {
  if (!uri) return "Unknown book";
  try {
    const last = uri.split("/").pop() || uri;
    return decodeURIComponent(last).replace(/\.(pdf|epub)$/i, "");
  } catch {
    return uri;
  }
}

export const PlanCard: FC<PlanCardProps> = ({
  planId,
  currentPlanInfo,
  onPress,
  onDeletePlan,
  onEditPlan,
  wrapperStyle,
  cardStyle,
  planItems,
}) => {
  const { colors } = useTheme();

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const menuAnchorRef = useRef<View | null>(null);

  // ✅ preview = only what we display (does NOT drive dot statuses)
  const [previewIndex, setPreviewIndex] = useState(0);

  const items = planItems ?? [];
  const planLen = items.length;

  if (!currentPlanInfo) return null;

  const {
    name,
    isCompleted,
    totalCompleted,
    totalPagesInPlan,
    currentBookName,
    currentBookUri,
    suggestedBookName,
    todayMinutes,
  } = currentPlanInfo;

  // reset preview when plan changes
  useEffect(() => {
    if (!planLen) {
      setPreviewIndex(0);
      return;
    }

    // initial preview: prefer currentBookUri if present in items
    const idx = currentBookUri
      ? items.findIndex((it) => it.bookUri === currentBookUri)
      : -1;

    setPreviewIndex(idx >= 0 ? idx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const safePreviewIndex =
    planLen > 0 ? Math.max(0, Math.min(planLen - 1, previewIndex)) : 0;

  const displayItem = planLen ? items[safePreviewIndex] : null;

  const safeTotal = Math.max(totalPagesInPlan || 1, 1);
  const pct01 = clamp01((totalCompleted || 0) / safeTotal);

  const progressColor = useMemo(
    () => getProgressColor(pct01, colors),
    [pct01, colors]
  );

  const openMenu = () => {
    const handle = findNodeHandle(menuAnchorRef.current);
    if (!handle) return;

    UIManager.measure(handle, (_x, _y, width, height, pageX, pageY) => {
      const windowW = Dimensions.get("window").width;
      const MENU_W = 160;
      const SAFE_PAD = 8;

      let x = pageX + width - MENU_W;
      x = Math.max(SAFE_PAD, Math.min(x, windowW - MENU_W - SAFE_PAD));
      const y = pageY + height + 8;

      setMenuPos({ x, y });
      setMenuVisible(true);
    });
  };

  const closeMenu = () => setMenuVisible(false);

  const handleDeletePlan = () => {
    closeMenu();
    onDeletePlan();
  };

  const minsSafe =
    typeof todayMinutes === "number" && Number.isFinite(todayMinutes)
      ? Math.max(0, Math.round(todayMinutes))
      : 0;

  const subtitle = isCompleted
    ? suggestedBookName
      ? `Done. Continue with "${suggestedBookName}".`
      : "Done for today."
    : currentBookName
    ? `Now: ${currentBookName}`
    : "Plan is in progress.";

  // selected item info (TargetCard-like)
  const itemLine = displayItem
    ? `Item ${safePreviewIndex + 1}/${planLen} · ${
        displayItem.pagesPerDay
      } pages/day`
    : null;

  const itemBookName =
    displayItem?.bookName || prettyNameFromUri(displayItem?.bookUri);

  // badge based on selected item
  const paceKeyForItem = displayItem?.bookUri ?? null;
  const remainingForItem = Math.max(
    0,
    Math.floor(displayItem?.pagesPerDay ?? 0)
  );

  // dots colors
  const statusActive = colors.success;
  const statusPending = colors.primaryLight;
  const statusDone = colors.textMuted;

  // ✅ IMPORTANT: dot status is NOT derived from previewIndex
  const dotItems = useMemo(() => {
    if (!planLen) return [];

    const idxFromNow = currentBookUri
      ? items.findIndex((it) => it.bookUri === currentBookUri)
      : -1;

    const activeIndex = idxFromNow >= 0 ? idxFromNow : 0;

    return items.map((it, idx) => ({
      id: it.bookUri || `__plan_${idx}__`,
      status: isCompleted
        ? ("done" as const)
        : idx === activeIndex
        ? ("active" as const)
        : ("pending" as const),
    }));
  }, [planLen, items, currentBookUri, isCompleted]);

  // swipe only changes preview (not status)
  const swipeThreshold = 18;
  const panResponder = useMemo(() => {
    if (!planLen) return null;

    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 6,
      onPanResponderRelease: (_, g) => {
        if (!planLen) return;

        if (g.dx <= -swipeThreshold) {
          setPreviewIndex((i) => Math.min(planLen - 1, i + 1));
        } else if (g.dx >= swipeThreshold) {
          setPreviewIndex((i) => Math.max(0, i - 1));
        }
      },
    });
  }, [planLen]);

  return (
    <>
      <TouchableOpacity
        style={[styles.wrapper, wrapperStyle]}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <Card style={[styles.card, cardStyle]}>
          <View style={styles.leftSection}>
            <View
              style={[
                styles.iconWrapper,
                {
                  backgroundColor: colors.surfaceStrong,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <BaseIcon
                name={isCompleted ? "checkmark-done-outline" : "time-outline"}
                size={iconSizes.lg}
                color={colors.success}
              />
            </View>

            <View style={styles.textBlock}>
              <View style={styles.headerRow}>
                <MText
                  variant="bodyStrong"
                  color="textPrimary"
                  numberOfLines={1}
                  style={styles.title}
                >
                  {name}
                </MText>

                <View ref={menuAnchorRef} collapsable={false}>
                  <IconButton
                    name="ellipsis-vertical"
                    size={iconSizes.md}
                    onPress={openMenu}
                  />
                </View>
              </View>
              <MText
                variant="body"
                color="textSecondary"
                numberOfLines={1}
                style={styles.subtitle}
              >
                {subtitle}
              </MText>

              {displayItem ? (
                <View style={{ marginTop: spacing.xs }}>
                  <MText
                    variant="caption"
                    color="textSecondary"
                    numberOfLines={1}
                  >
                    {itemLine}
                  </MText>
                  <MText
                    variant="body"
                    color="textPrimary"
                    numberOfLines={1}
                    style={{ fontWeight: "800" }}
                  >
                    {itemBookName}
                  </MText>
                </View>
              ) : null}

              <View style={styles.pillRow}>
                <ProgressPill
                  value={totalCompleted}
                  total={totalPagesInPlan}
                  width={110}
                  height={6}
                  fillColor={progressColor}
                />
              </View>

              <View style={styles.metaRow}>
                <MText
                  variant="caption"
                  color="textSecondary"
                  numberOfLines={1}
                  style={styles.metaText}
                >
                  {`${totalCompleted ?? 0}/${
                    totalPagesInPlan ?? 0
                  } pages · ${minsSafe} min`}
                </MText>

                <RemainingTimeBadge
                  paceKey={paceKeyForItem}
                  remainingPages={remainingForItem}
                />
              </View>

              {dotItems.length ? (
                <View
                  style={styles.dotContainer}
                  {...(panResponder ? panResponder.panHandlers : {})}
                >
                  <ItemDots
                    items={dotItems as any}
                    activeColor={statusActive}
                    doneColor={statusDone}
                    pendingColor={statusPending}
                    maxDots={10}
                    selectedIndex={safePreviewIndex}
                    onSelectIndex={setPreviewIndex}
                  />
                </View>
              ) : null}
            </View>
          </View>
        </Card>
      </TouchableOpacity>

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
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                closeMenu();
                onPress();
              }}
            >
              <MText variant="body" color="textPrimary">
                Open plan
              </MText>
            </TouchableOpacity>

            {!!onEditPlan && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  closeMenu();
                  onEditPlan();
                }}
              >
                <MText variant="body" color="textPrimary">
                  Edit plan
                </MText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDeletePlan}
            >
              <MText variant="body" color="danger">
                Delete plan
              </MText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  card: {
    padding: spacing.md,
    borderRadius: radii.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    gap: spacing.sm,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  textBlock: { flex: 1 },

  title: { marginBottom: 2 },
  subtitle: { marginBottom: spacing.xs, opacity: 0.9 },

  pillRow: { marginTop: spacing.xs, marginBottom: spacing.xs },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  metaText: { flex: 1, opacity: 0.85 },

  dotContainer: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },

  headerRow: {
    marginLeft: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  menuOverlay: { flex: 1, backgroundColor: "transparent" },
  popover: {
    position: "absolute",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    width: 160,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  menuItem: { paddingVertical: spacing.sm },
});
