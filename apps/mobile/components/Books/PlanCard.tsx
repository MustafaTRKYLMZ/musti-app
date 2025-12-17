import React, { FC, useRef, useState, useMemo } from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Modal,
  UIManager,
  findNodeHandle,
  StyleProp,
  ViewStyle,
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

export type PlanInfo = {
  name: string;
  isCompleted: boolean;
  totalCompleted: number;
  totalPagesInPlan: number;
  currentBookName?: string;
  currentBookUri?: string;
  remainingInItem?: number;
  suggestedBookName?: string;
};

type PlanCardProps = {
  currentPlanInfo: PlanInfo | null;
  onPress: () => void;
  onDeletePlan: () => void;
  onEditPlan?: () => void;
  wrapperStyle?: StyleProp<ViewStyle>;
  cardStyle?: StyleProp<ViewStyle>;
};

export const PlanCard: FC<PlanCardProps> = ({
  currentPlanInfo,
  onPress,
  onDeletePlan,
  onEditPlan,
  wrapperStyle,
  cardStyle,
}) => {
  const theme = useTheme();
  const { colors } = theme;

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const menuIconRef = useRef<View | null>(null);

  if (!currentPlanInfo) return null;

  const {
    name,
    isCompleted,
    totalCompleted,
    totalPagesInPlan,
    currentBookName,
    remainingInItem,
    suggestedBookName,
  } = currentPlanInfo;

  const progressText = `${totalCompleted} / ${totalPagesInPlan} pages`;

  const subtitle = isCompleted
    ? suggestedBookName
      ? `Today's plan is done. To keep reading, continue with "${suggestedBookName}".`
      : "Today's plan is done."
    : currentBookName
    ? `Now: ${currentBookName}${
        typeof remainingInItem === "number"
          ? ` (${remainingInItem} pages left in this step)`
          : ""
      }`
    : "Plan is in progress.";

  const openMenu = () => {
    const handle = findNodeHandle(menuIconRef.current);
    if (!handle) return;

    UIManager.measure(handle, (_x, _y, width, height, pageX, pageY) => {
      setMenuPos({ x: pageX + width - 160, y: pageY + height + 8 });
      setMenuVisible(true);
    });
  };

  const closeMenu = () => setMenuVisible(false);

  const handleDeletePlan = () => {
    setMenuVisible(false);
    onDeletePlan();
  };

  const handleCardPress = () => {
    if (isCompleted) return;
    onPress();
  };

  const safeTotal = Math.max(totalPagesInPlan || 1, 1);
  const pct01 = totalCompleted / safeTotal;

  // ✅ Icon her zaman yeşil (pozitif)
  const iconColor = colors.success;

  // ✅ Progress sarı -> yeşil (ama iconu etkilemez)
  const progressColor = useMemo(
    () => getProgressColor(pct01, colors),
    [pct01, colors]
  );

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
                color={iconColor}
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
            </View>
          </View>

          <View style={styles.rightSection}>
            <IconButton
              ref={menuIconRef}
              name="ellipsis-vertical"
              size={iconSizes.md}
              onPress={openMenu}
            />
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
            {!isCompleted && (
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
            )}

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
