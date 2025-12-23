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

  // ✅ minutes today (plan mode)
  todayMinutes?: number;
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

  const handleCardPress = () => {
    onPress();
  };

  const progressText = useMemo(() => {
    const pagesPart = `${totalCompleted ?? 0} / ${totalPagesInPlan ?? 0} pages`;
    const mins =
      typeof todayMinutes === "number" && Number.isFinite(todayMinutes)
        ? Math.max(0, Math.round(todayMinutes))
        : 0;

    return `${pagesPart} · ${mins} min`;
  }, [totalCompleted, totalPagesInPlan, todayMinutes]);

  const subtitle = isCompleted
    ? suggestedBookName
      ? `Today's plan is done. Continue with "${suggestedBookName}".`
      : "Today's plan is done."
    : currentBookName
    ? `Now: ${currentBookName}${
        typeof remainingInItem === "number"
          ? ` (${remainingInItem} pages left)`
          : ""
      }`
    : "Plan is in progress.";

  // ✅ remaining pages for TODAY's plan (whole plan progress)
  const remainingPagesToday =
    totalPagesInPlan > 0
      ? Math.max(0, totalPagesInPlan - (totalCompleted ?? 0))
      : null;

  // ✅ paceKey should be book-specific; use current reading book when available
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
                numberOfLines={2}
                style={styles.subtitle}
              >
                {subtitle}
              </MText>

              <View style={styles.progressRow}>
                <ProgressPill
                  value={totalCompleted}
                  total={totalPagesInPlan}
                  width={90}
                  height={6}
                  fillColor={progressColor}
                />
                <MText variant="caption" color="textSecondary">
                  {progressText}
                </MText>
              </View>

              {/* ✅ Remaining time for TODAY (plan) */}
              <View style={{ marginTop: spacing.xs }}>
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
  title: { marginBottom: spacing.xs / 2 },
  subtitle: { marginBottom: spacing.xs },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
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
