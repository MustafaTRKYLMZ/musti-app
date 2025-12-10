// apps/mobile/components/ui/Books/BookCard.tsx
import React, { FC, useRef, useState, useEffect } from "react";
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
import { BaseIcon, IconButton } from "@/components/ui/AppIcon";
import type { LocalPdfFile } from "@/utils/getPdfsDirectory";

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

// Sıcak kitap sırtı renk paleti (ahşap / deri tonları)
const SPINE_PALETTE = [
  "#8B5A2B", // warm brown
  "#A1623B",
  "#C17F4D",
  "#7B4A2A",
  "#D19A66",
  "#B86B35",
  "#9C6644",
  "#BF8F68",
];

// String'den deterministik renk seç
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

  // 3-dot menu state
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const menuIconRef = useRef<View | null>(null);

  // rename modal state
  const [renameVisible, setRenameVisible] = useState(false);
  const [tempName, setTempName] = useState(file.name);

  const progress =
    totalPages && totalPages > 0 && lastPage && lastPage > 0
      ? Math.min(1, lastPage / totalPages)
      : 0;

  // --- Animations ---
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

  const openMenu = () => {
    const handle = findNodeHandle(menuIconRef.current);
    if (!handle) return;

    UIManager.measure(handle, (_x, _y, width, height, pageX, pageY) => {
      setMenuPos({
        x: pageX + width - 140,
        y: pageY + height + 8,
      });
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

  return (
    <>
      {/* CARD */}
      <TouchableOpacity
        onPress={onOpen}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardWrapper}
        activeOpacity={0.85}
      >
        <Animated.View style={animatedCardStyle}>
          <Card style={[styles.card, variant === "grid" && styles.cardGrid]}>
            {/* Dekoratif kitap elemanları */}
            {/* Spine (renkli kitap sırtı) */}
            <View
              style={[
                styles.bookSpine,
                {
                  backgroundColor: spineColor,
                  borderRightColor: spineEdgeColor,
                },
              ]}
            />
            {/* Spine highlight */}
            <View
              style={[
                styles.bookSpineHighlight,
                {
                  backgroundColor: "rgba(255,255,255,0.16)",
                },
              ]}
            />
            {/* Üst sayfa kenarı */}
            <View
              style={[
                styles.bookPageEdgeTop,
                { backgroundColor: colors.backgroundSecondary },
              ]}
            />

            {/* Sağ sayfa kenarı (SVG çizgili) */}
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

            {/* Header: icon + title + 3-dot */}
            <View style={styles.cardHeader}>
              <View style={styles.cardIconTitle}>
                <BaseIcon
                  name="document-text-outline"
                  size={iconSizes.lg}
                  color={colors.textPrimary}
                />
                <MText
                  variant="body"
                  style={styles.itemTitle}
                  numberOfLines={2}
                >
                  {file.name}
                </MText>
              </View>

              <IconButton
                ref={menuIconRef}
                name="ellipsis-vertical"
                size={iconSizes.md}
                color={colors.textPrimary}
                onPress={openMenu}
              />
            </View>

            {/* Progress (lastPage / totalPages) */}
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
                  {Math.round(progress * 100)}% · {lastPage ?? 0} / {totalPages}{" "}
                  pages
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

            {/* Footer: today info */}
            <View style={styles.cardFooter}>
              {typeof todayPages === "number" && todayPages > 0 && (
                <MText
                  variant="body"
                  color="textSecondary"
                  style={styles.cardHint}
                  numberOfLines={1}
                >
                  {todayTargetPages
                    ? `Today: ${todayPages} / ${todayTargetPages} pages`
                    : `Today: ${todayPages} pages`}
                </MText>
              )}
            </View>
          </Card>
        </Animated.View>
      </TouchableOpacity>

      {/* 3-dot POPOVER MENU */}
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
            {onRename && (
              <TouchableOpacity style={styles.menuItem} onPress={openRename}>
                <MText variant="body" color="textPrimary">
                  Rename
                </MText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDeleteFromMenu}
            >
              <MText variant="body" color="danger">
                Delete
              </MText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* RENAME MODAL */}
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
  card: {
    width: 220,
    height: 140,
    padding: spacing.md,
    justifyContent: "space-between",
    overflow: "hidden",
  },

  cardGrid: {
    width: "100%",
    height: undefined,
    aspectRatio: 0.7,
  },

  // Book decoration
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

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardIconTitle: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  itemTitle: {
    marginLeft: spacing.sm,
    flexShrink: 1,
  },
  cardHint: {
    marginTop: spacing.xs,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Progress
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
  },

  // Popover menu
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
    width: 140,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  menuItem: {
    paddingVertical: spacing.sm,
  },

  // Rename modal
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
