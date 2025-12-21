// apps/mobile/components/ui/Books/BookCard.tsx
import React, { FC, useRef, useState, useEffect, useMemo } from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  UIManager,
  findNodeHandle,
  Animated,
} from "react-native";
import Svg, { Rect, Line } from "react-native-svg";
import {
  MText,
  spacing,
  radii,
  iconSizes,
  useTheme,
  Card,
} from "@budget/ui-native";
import { IconButton, BaseIcon } from "@/components/ui/AppIcon";
import type { LocalPdfFile } from "@/utils/getPdfsDirectory";
import { Dimensions } from "react-native";

type BookCardProps = {
  file: LocalPdfFile;
  onOpen: () => void;
  onDelete: () => void;
  onRename?: (newName: string) => void;
  lastPage?: number;
  totalPages?: number;

  todayPages?: number;
  todayTargetPages?: number;

  variant?: "row" | "grid";
};

const SPINE_PALETTE = [
  "#8B5A2B",
  "#A1623B",
  "#C17F4D",
  "#7B4A2A",
  "#D19A66",
  "#B86B35",
  "#9C6644",
  "#BF8F68",
];

function getSpineColorFromString(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const index = hash % SPINE_PALETTE.length;
  return SPINE_PALETTE[index];
}

export const BookCard: FC<BookCardProps> = ({
  file,
  onOpen,
  onDelete,
  onRename,
  lastPage,
  totalPages,
  todayPages,
  todayTargetPages,
  variant = "grid",
}) => {
  const theme = useTheme();
  const { colors } = theme;

  const bookId = file.uri ?? file.name;
  const spineColor = getSpineColorFromString(bookId);
  const spineEdgeColor = "rgba(0,0,0,0.25)";

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const menuIconRef = useRef<View | null>(null);

  const [renameVisible, setRenameVisible] = useState(false);
  const [tempName, setTempName] = useState(file.name);

  // ✅ stats modal
  const [statsVisible, setStatsVisible] = useState(false);

  const progress =
    totalPages && totalPages > 0 && lastPage && lastPage > 0
      ? Math.min(1, lastPage / totalPages)
      : 0;

  const appearAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(appearAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [appearAnim]);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 0,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const animatedCardStyle = {
    transform: [
      {
        translateY: appearAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 0],
        }),
      },
      {
        scale: pressAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.97],
        }),
      },
      {
        rotateY: pressAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "-5deg"],
        }),
      },
    ],
    opacity: appearAnim,
  };

  const POPOVER_W = 160;
  const EDGE = 8;

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  const openMenu = () => {
    const handle = findNodeHandle(menuIconRef.current);
    if (!handle) return;

    const screenW = Dimensions.get("window").width;

    UIManager.measure(handle, (_x, _y, width, height, pageX, pageY) => {
      // default: iconun sağından popover aç
      const desiredX = pageX + width - POPOVER_W;

      // ✅ clamp: ekran dışına taşmasın
      const x = clamp(desiredX, EDGE, screenW - POPOVER_W - EDGE);

      // y için de ufak güvenlik payı
      const y = Math.max(EDGE, pageY + height + 8);

      setMenuPos({ x, y });
      setMenuVisible(true);
    });
  };

  const closeMenu = () => setMenuVisible(false);

  const openRename = () => {
    setTempName(file.name);
    setMenuVisible(false);
    setRenameVisible(true);
  };

  const cancelRename = () => {
    setRenameVisible(false);
  };

  const confirmRename = () => {
    if (!onRename) {
      setRenameVisible(false);
      return;
    }
    const trimmed = tempName.trim();
    if (!trimmed || trimmed === file.name) {
      setRenameVisible(false);
      return;
    }
    onRename(trimmed);
    setRenameVisible(false);
  };

  const handleDeleteFromMenu = () => {
    setMenuVisible(false);
    onDelete();
  };

  const openStatsFromMenu = () => {
    setMenuVisible(false);
    setStatsVisible(true);
  };

  // ✅ stats strings
  const safeTodayPages = Math.max(0, Number(todayPages ?? 0) || 0);
  const safeTodayTarget = Math.max(0, Number(todayTargetPages ?? 0) || 0);

  const showTodayHint = safeTodayPages > 0 || safeTodayTarget > 0;

  const todayLine = useMemo(() => {
    return `${safeTodayPages}`;
  }, [safeTodayPages]);

  const goalLine = useMemo(() => {
    if (safeTodayTarget <= 0) return null;
    return `Goal: ${safeTodayTarget}`;
  }, [safeTodayTarget]);

  const lastPosLine = useMemo(() => {
    const lp = Math.max(0, Number(lastPage ?? 0) || 0);
    const tp = Math.max(0, Number(totalPages ?? 0) || 0);
    if (tp > 0) return `${lp} / ${tp}`;
    return lp > 0 ? String(lp) : "—";
  }, [lastPage, totalPages]);

  return (
    <>
      <TouchableOpacity
        onPress={onOpen}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardWrapper}
        activeOpacity={0.85}
      >
        <Animated.View style={animatedCardStyle}>
          <Card
            style={[
              styles.cardBase,
              variant === "grid" ? styles.cardGrid : styles.cardRow,
            ]}
          >
            {/* Decorative book structure */}
            <View
              style={[
                styles.bookSpine,
                {
                  backgroundColor: spineColor,
                  borderRightColor: spineEdgeColor,
                },
              ]}
            />
            <View
              style={[
                styles.bookSpineHighlight,
                { backgroundColor: "rgba(255,255,255,0.16)" },
              ]}
            />
            <View
              style={[
                styles.bookPageEdgeTop,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            />
            <View style={styles.bookPageEdgeRight} pointerEvents="none">
              <Svg width="100%" height="100%">
                <Rect
                  x={0}
                  y={0}
                  width="100%"
                  height="100%"
                  fill={colors.surface}
                  opacity={0.94}
                />
                {Array.from({ length: 6 }).map((_, idx) => {
                  const x = 4 + idx * 4;
                  return (
                    <Line
                      key={idx}
                      x1={x}
                      y1={2}
                      x2={x}
                      y2={"98%"}
                      stroke={colors.borderSubtle}
                      strokeWidth={0.6}
                      opacity={0.55 - idx * 0.06}
                    />
                  );
                })}
              </Svg>
            </View>

            {/* ✅ ONLY ellipsis in the corner (same place) */}
            <View
              style={styles.menuIconWrapper}
              ref={menuIconRef}
              collapsable={false}
            >
              <IconButton
                name="ellipsis-vertical"
                size={iconSizes.md}
                color={colors.textPrimary}
                onPress={openMenu}
                hitSlop={8}
              />
            </View>

            {/* Centered title */}
            <View style={styles.titleWrapper}>
              <MText
                variant="body"
                color="textPrimary"
                style={styles.title}
                numberOfLines={2}
              >
                {file.name}
              </MText>

              {/* ✅ Today hint with small icon (12px) */}
              {showTodayHint && (
                <View style={styles.todayBlock}>
                  <View style={styles.todayRow}>
                    <BaseIcon
                      family="ion"
                      name="flame-outline"
                      size={12}
                      color={colors.textSecondary}
                    />
                    <MText
                      variant="caption"
                      color="textSecondary"
                      numberOfLines={1}
                      style={styles.todayText}
                    >
                      Today: {todayLine}
                    </MText>
                  </View>

                  {!!goalLine && (
                    <MText
                      variant="caption"
                      color="textSecondary"
                      numberOfLines={1}
                      style={styles.goalText}
                    >
                      {goalLine}
                    </MText>
                  )}
                </View>
              )}
            </View>

            {/* Progress */}
            {totalPages && totalPages > 0 ? (
              <>
                <View
                  style={[
                    styles.progressContainer,
                    { backgroundColor: colors.borderSubtle },
                  ]}
                >
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${progress * 100}%`,
                        backgroundColor: colors.success,
                      },
                    ]}
                  />
                </View>
                <MText
                  variant="body"
                  color="textSecondary"
                  style={styles.progressLabel}
                  numberOfLines={1}
                >
                  {Math.round(progress * 100)}% · {lastPage ?? 0} / {totalPages}
                </MText>
              </>
            ) : (
              <MText
                variant="body"
                color="textSecondary"
                style={styles.cardHint}
                numberOfLines={1}
              >
                Tap to open
              </MText>
            )}
          </Card>
        </Animated.View>
      </TouchableOpacity>

      {/* 3-dot menu */}
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
            {/* ✅ Stats entry inside the menu */}
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={openStatsFromMenu}
            >
              <BaseIcon
                family="ion"
                name="stats-chart-outline"
                size={16}
                color={colors.textPrimary}
              />
              <MText variant="body" color="textPrimary">
                Stats
              </MText>
            </TouchableOpacity>

            {onRename && (
              <TouchableOpacity style={styles.menuItemRow} onPress={openRename}>
                <BaseIcon
                  family="ion"
                  name="create-outline"
                  size={16}
                  color={colors.textPrimary}
                />
                <MText variant="body" color="textPrimary">
                  Rename
                </MText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={handleDeleteFromMenu}
            >
              <BaseIcon
                family="ion"
                name="trash-outline"
                size={16}
                color={colors.danger}
              />
              <MText variant="body" color="danger">
                Delete
              </MText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ✅ Stats modal */}
      <Modal
        visible={statsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatsVisible(false)}
      >
        <TouchableOpacity
          style={[
            styles.statsOverlay,
            { backgroundColor: colors.backdropStrong },
          ]}
          activeOpacity={1}
          onPress={() => setStatsVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={[
              styles.statsBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.statsHeaderRow}>
              <MText
                variant="bodyStrong"
                color="textPrimary"
                numberOfLines={1}
                style={{ flex: 1 }}
              >
                {file.name}
              </MText>
              <IconButton
                name="close-outline"
                size={iconSizes.lg}
                color={colors.textPrimary}
                onPress={() => setStatsVisible(false)}
              />
            </View>

            <View style={{ height: spacing.sm }} />

            <View style={styles.statsRow}>
              <MText variant="body" color="textSecondary">
                Today
              </MText>
              <MText variant="body" color="textPrimary">
                {todayLine}
              </MText>
            </View>

            {goalLine && (
              <View style={styles.statsRow}>
                <MText variant="body" color="textSecondary">
                  Goal
                </MText>
                <MText variant="body" color="textPrimary">
                  {safeTodayTarget} pages
                </MText>
              </View>
            )}

            <View style={styles.statsRow}>
              <MText variant="body" color="textSecondary">
                Last position
              </MText>
              <MText variant="body" color="textPrimary">
                {lastPosLine}
              </MText>
            </View>

            <View style={styles.statsRow}>
              <MText variant="body" color="textSecondary">
                Total progress
              </MText>
              <MText variant="body" color="textPrimary">
                {totalPages && totalPages > 0
                  ? `${Math.round(progress * 100)}%`
                  : "—"}
              </MText>
            </View>

            <View style={{ height: spacing.md }} />

            <MText
              variant="caption"
              color="textSecondary"
              style={{ opacity: 0.9 }}
            >
              More details will be on the Stats screen (next step).
            </MText>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Rename modal */}
      <Modal
        visible={renameVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelRename}
      >
        <KeyboardAvoidingView
          style={[
            styles.renameOverlay,
            { backgroundColor: colors.backdropStrong },
          ]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={[
              styles.renameBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <MText
              variant="body"
              color="textPrimary"
              style={styles.renameTitle}
            >
              Rename book
            </MText>

            <TextInput
              value={tempName}
              onChangeText={setTempName}
              style={[
                styles.renameInput,
                {
                  borderColor: colors.borderSubtle,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="Book name"
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.renameActions}>
              <TouchableOpacity
                onPress={cancelRename}
                style={[
                  styles.renameButton,
                  styles.renameCancel,
                  { borderColor: colors.borderSubtle },
                ]}
              >
                <MText variant="body" color="textSecondary">
                  Cancel
                </MText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmRename}
                style={[
                  styles.renameButton,
                  styles.renameConfirm,
                  { backgroundColor: colors.primary },
                ]}
              >
                <MText variant="body" color="textInverse">
                  Save
                </MText>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginRight: spacing.md,
  },

  // shared base
  cardBase: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: "space-between",
    overflow: "hidden",
  },

  // Last read (horizontal)
  cardRow: {
    width: 120,
    height: undefined,
    aspectRatio: 0.8,
  },

  // Books grid
  cardGrid: {
    width: "100%",
    height: undefined,
    aspectRatio: 0.8,
  },

  // decoration
  bookSpine: {
    position: "absolute",
    left: 0,
    top: spacing.sm,
    bottom: spacing.sm,
    width: 14,
    borderTopLeftRadius: radii.lg,
    borderBottomLeftRadius: radii.lg,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  bookSpineHighlight: {
    position: "absolute",
    left: 14,
    top: spacing.sm,
    bottom: spacing.sm,
    width: 4,
    borderTopLeftRadius: radii.lg,
    borderBottomLeftRadius: radii.lg,
  },
  bookPageEdgeTop: {
    position: "absolute",
    top: spacing.sm,
    left: 22,
    right: spacing.sm,
    height: 4,
    borderRadius: 4,
    opacity: 0.4,
  },
  bookPageEdgeRight: {
    position: "absolute",
    top: spacing.sm + 4,
    bottom: spacing.sm,
    right: 0,
    width: 26,
  },

  // menu icon (common)
  menuIconWrapper: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    zIndex: 2,
  },

  // centered title (common)
  titleWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  title: {
    textAlign: "center",
    fontSize: 14,
  },

  // today row (with 12 icon)
  todayRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  todayText: {
    textAlign: "center",
    opacity: 0.92,
  },

  cardHint: {
    marginTop: spacing.xs,
  },

  progressContainer: {
    height: 6,
    width: "100%",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: spacing.sm,
  },
  progressBar: {
    height: "100%",
  },
  progressLabel: {
    marginTop: spacing.xs,
    fontSize: spacing.lg - 4,
    paddingHorizontal: spacing.xs,
  },

  menuOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
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
  menuItemRow: {
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  // stats modal
  statsOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  statsBox: {
    width: "100%",
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
  },
  statsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  todayBlock: {
    marginTop: 2,
    alignItems: "center",
  },
  goalText: {
    marginTop: 1,
    opacity: 0.9,
    textAlign: "center",
  },
  // rename
  renameOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  renameBox: {
    width: "85%",
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
  },
  renameTitle: {
    marginBottom: spacing.sm,
  },
  renameInput: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  renameActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  renameButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
  },
  renameCancel: {
    borderWidth: 1,
  },
  renameConfirm: {},
});
