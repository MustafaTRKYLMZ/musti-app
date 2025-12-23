import React, { FC, useMemo, useRef, useState } from "react";
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

export type PlanInfo = {
  name: string;
  isCompleted: boolean;
  totalCompleted: number; // pages today
  totalPagesInPlan: number; // pages target today
  currentBookName?: string;
  currentBookUri?: string;
  remainingInItem?: number;
  suggestedBookName?: string;
  todayMinutes?: number; // minutes today (plan mode)
};

type PlanCardProps = {
  currentPlanInfo: PlanInfo | null;
  onPress: () => void;
  onDeletePlan: () => void;
  onEditPlan?: () => void;
  wrapperStyle?: StyleProp<ViewStyle>;
  cardStyle?: StyleProp<ViewStyle>;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export const PlanCard: FC<PlanCardProps> = ({
  currentPlanInfo,
  onPress,
  onDeletePlan,
  onEditPlan,
  wrapperStyle,
  cardStyle,
}) => {
  const { colors } = useTheme();

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const menuAnchorRef = useRef<View | null>(null);

  if (!currentPlanInfo) return null;

  const {
    name,
    isCompleted,
    totalCompleted,
    totalPagesInPlan,
    currentBookName,
    currentBookUri,
    remainingInItem,
    suggestedBookName,
    todayMinutes,
  } = currentPlanInfo;

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

  const handleCardPress = () => onPress();

  const minsSafe =
    typeof todayMinutes === "number" && Number.isFinite(todayMinutes)
      ? Math.max(0, Math.round(todayMinutes))
      : 0;

  // Plan-level remaining
  const remainingPagesToday =
    totalPagesInPlan > 0
      ? Math.max(0, totalPagesInPlan - (totalCompleted ?? 0))
      : 0;

  // Prefer per-item remaining for display (more meaningful)
  const remainingForDisplay =
    typeof remainingInItem === "number" && Number.isFinite(remainingInItem)
      ? Math.max(0, Math.floor(remainingInItem))
      : remainingPagesToday;

  const subtitle = isCompleted
    ? suggestedBookName
      ? `Done. Continue with "${suggestedBookName}".`
      : "Done for today."
    : currentBookName
    ? `Now: ${currentBookName}`
    : "Plan is in progress.";

  // Single compact meta line
  const metaLeft = useMemo(() => {
    const a = `${totalCompleted ?? 0}/${totalPagesInPlan ?? 0} pages`;
    const b = `${minsSafe} min`;
    const c = isCompleted ? "0 left" : `${remainingForDisplay} left`;
    return `${a} · ${b} · ${c}`;
  }, [
    totalCompleted,
    totalPagesInPlan,
    minsSafe,
    remainingForDisplay,
    isCompleted,
  ]);

  const paceKey = currentBookUri ?? null;

  return (
    <>
      <TouchableOpacity
        style={[styles.wrapper, wrapperStyle]}
        activeOpacity={0.9}
        onPress={handleCardPress}
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
              <MText
                variant="bodyStrong"
                color="textPrimary"
                numberOfLines={1}
                style={styles.title}
              >
                {name}
              </MText>

              <MText
                variant="body"
                color="textSecondary"
                numberOfLines={1}
                style={styles.subtitle}
              >
                {subtitle}
              </MText>

              {/* Progress pill (alone, clean) */}
              <View style={styles.pillRow}>
                <ProgressPill
                  value={totalCompleted}
                  total={totalPagesInPlan}
                  width={110}
                  height={6}
                  fillColor={progressColor}
                />
              </View>

              {/* Single meta row: left text + right badge */}
              <View style={styles.metaRow}>
                <MText
                  variant="caption"
                  color="textSecondary"
                  numberOfLines={1}
                  style={styles.metaText}
                >
                  {metaLeft}
                </MText>

                <RemainingTimeBadge
                  paceKey={paceKey}
                  remainingPages={remainingPagesToday}
                />
              </View>
            </View>
          </View>

          <View style={styles.rightSection}>
            <View ref={menuAnchorRef} collapsable={false}>
              <IconButton
                name="ellipsis-vertical"
                size={iconSizes.md}
                onPress={openMenu}
              />
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

  pillRow: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  metaText: {
    flex: 1,
    opacity: 0.85,
  },

  rightSection: { marginLeft: spacing.sm },

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
