import React, { FC, useRef, useState, useEffect, useMemo } from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Modal,
  UIManager,
  findNodeHandle,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import Svg, { Rect, Line } from "react-native-svg";

import { useTranslation } from "@musti/core";
import {
  MText,
  spacing,
  radii,
  iconSizes,
  useTheme,
  Card,
  bookshelfTheme,
} from "@musti/ui-native";
import { IconButton, BaseIcon } from "@musti/ui-native";
import type { LocalPdfFile } from "@/utils/getPdfsDirectory";
import { usePdfCoverFromCache } from "@/hooks/usePdfCoverFromCache";
import {
  BookCardFooter,
  BOOK_NAMEPLATE_HEIGHT,
  BOOK_NAMEPLATE_INSET_X,
} from "./BookCardFooter";
import { BOOK_SHELF_LIFT } from "./shelfLayout";

const { colors } = bookshelfTheme;

/** Wide enough for long menu labels (e.g. TR "Yeniden adlandır"). */
const BOOK_MENU_POPOVER_W = 228;
const BOOK_MENU_EDGE = 8;
type BookCardProps = {
  file: LocalPdfFile;
  onOpen: () => void;
  onDelete: () => void;
  onRequestRename?: () => void;

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
  for (let i = 0; i < id.length; i++)
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return SPINE_PALETTE[hash % SPINE_PALETTE.length];
}

const GRID_COLS = 3;
const GRID_H_PADDING_TOTAL = spacing.lg * 2;
const GRID_GAP = spacing.md;

const ROW_W = 120;

const CONTACT_SHADOW_Y = -4;

export const BookCard: FC<BookCardProps> = ({
  file,
  onOpen,
  onDelete,
  onRequestRename,
  lastPage,
  totalPages,
  todayPages,
  variant = "grid",
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const bookId = file.uri ?? file.name;
  const spineColor = getSpineColorFromString(bookId);
  const spineEdgeColor = "rgba(0,0,0,0.25)";

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const menuIconRef = useRef<View | null>(null);

  const [statsVisible, setStatsVisible] = useState(false);

  const progress =
    totalPages && totalPages > 0 && lastPage && lastPage > 0
      ? Math.min(1, lastPage / totalPages)
      : 0;

  const appearAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(0)).current;

  const cover = usePdfCoverFromCache(file.uri ?? null);
  const showCover = cover.ready && !!cover.coverUri;

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
    ],
    opacity: appearAnim,
  };

  const gridItemWidth = useMemo(() => {
    const screenW = Dimensions.get("window").width;
    const available =
      screenW - GRID_H_PADDING_TOTAL - GRID_GAP * (GRID_COLS - 1);
    return Math.max(110, Math.floor(available / GRID_COLS));
  }, []);

  const isRow = variant === "row";
  const wrapperW = isRow ? ROW_W : gridItemWidth;

  const safeTodayPages = Math.max(0, Number(todayPages ?? 0) || 0);

  const lastPosLine = useMemo(() => {
    const lp = Math.max(0, Number(lastPage ?? 0) || 0);
    const tp = Math.max(0, Number(totalPages ?? 0) || 0);
    if (tp > 0) return `${lp} / ${tp}`;
    return lp > 0 ? String(lp) : "—";
  }, [lastPage, totalPages]);

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  const openMenu = () => {
    const handle = findNodeHandle(menuIconRef.current);
    if (!handle) return;

    const screenW = Dimensions.get("window").width;

    UIManager.measure(handle, (_x, _y, width, height, pageX, pageY) => {
      const desiredX = pageX + width - BOOK_MENU_POPOVER_W;
      const x = clamp(
        desiredX,
        BOOK_MENU_EDGE,
        screenW - BOOK_MENU_POPOVER_W - BOOK_MENU_EDGE
      );
      const y = Math.max(BOOK_MENU_EDGE, pageY + height + 8);
      setMenuPos({ x, y });
      setMenuVisible(true);
    });
  };

  const closeMenu = () => setMenuVisible(false);

  const handleDeleteFromMenu = () => {
    setMenuVisible(false);
    onDelete();
  };

  const openStatsFromMenu = () => {
    setMenuVisible(false);
    setStatsVisible(true);
  };

  const requestRenameFromMenu = () => {
    setMenuVisible(false);
    onRequestRename?.();
  };

  return (
    <>
      <TouchableOpacity
        onPress={onOpen}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          isRow ? styles.cardWrapperRow : styles.cardWrapperGrid,
          { marginBottom: BOOK_SHELF_LIFT },
        ]}
        activeOpacity={0.85}
      >
        <Animated.View style={animatedCardStyle}>
          <View style={[styles.cardOuter, { width: wrapperW }]}>
            <Card
              style={[
                styles.cardBase,
                { width: wrapperW },
                isRow ? styles.cardRow : styles.cardGrid,
              ]}
            >
              <View style={styles.body}>
                {showCover && (
                  <View style={styles.coverClip} pointerEvents="none">
                    <Image
                      source={{ uri: cover.coverUri! }}
                      style={styles.coverImg}
                      resizeMode="cover"
                    />
                  </View>
                )}

                <View
                  style={[
                    styles.bookSpine,
                    {
                      backgroundColor: spineColor,
                      borderRightColor: spineEdgeColor,
                    },
                  ]}
                />
                <View style={styles.bookSpineHighlight} />
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

                <View
                  style={styles.menuIconWrapper}
                  ref={menuIconRef}
                  collapsable={false}
                >
                  <View style={styles.menuChip}>
                    <IconButton
                      name="ellipsis-vertical"
                      color={colors.textPrimary}
                      onPress={openMenu}
                      hitSlop={8}
                    />
                  </View>
                </View>

                <View
                  pointerEvents="none"
                  style={[
                    styles.nameplateWrap,
                    {
                      left: BOOK_NAMEPLATE_INSET_X,
                      right: BOOK_NAMEPLATE_INSET_X,
                    },
                  ]}
                >
                  <BookCardFooter
                    file={file}
                    totalPages={totalPages}
                    progress={progress}
                    width={wrapperW - BOOK_NAMEPLATE_INSET_X * 2}
                  />
                </View>
              </View>
            </Card>

            <View
              pointerEvents="none"
              style={[
                styles.contactShadow,
                {
                  width: wrapperW,
                  bottom: CONTACT_SHADOW_Y,
                },
              ]}
            />
          </View>
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
                width: BOOK_MENU_POPOVER_W,
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItemRow}
              onPress={openStatsFromMenu}
            >
              <BaseIcon
                family="ion"
                name="stats-chart-outline"
                color={colors.textPrimary}
              />
              <MText
                variant="body"
                color="textPrimary"
                style={styles.menuItemLabel}
              >
                {t("bookshelf.book.stats")}
              </MText>
            </TouchableOpacity>

            {!!onRequestRename && (
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={requestRenameFromMenu}
              >
                <BaseIcon
                  family="ion"
                  name="create-outline"
                  color={colors.textPrimary}
                />
                <MText
                  variant="body"
                  color="textPrimary"
                  style={styles.menuItemLabel}
                >
                  {t("bookshelf.book.rename")}
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
                color={colors.danger}
              />
              <MText variant="body" color="danger" style={styles.menuItemLabel}>
                {t("delete")}
              </MText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* stats modal */}
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
                color={colors.textPrimary}
                onPress={() => setStatsVisible(false)}
              />
            </View>

            <View style={{ height: spacing.sm }} />

            <View style={styles.statsRow}>
              <MText variant="body" color="textSecondary">
                {t("today")}
              </MText>
              <MText variant="body" color="textPrimary">
                {safeTodayPages}
              </MText>
            </View>

            <View style={styles.statsRow}>
              <MText variant="body" color="textSecondary">
                {t("bookshelf.book.lastPosition")}
              </MText>
              <MText variant="body" color="textPrimary">
                {lastPosLine}
              </MText>
            </View>

            <View style={styles.statsRow}>
              <MText variant="body" color="textSecondary">
                {t("bookshelf.book.totalProgress")}
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
              {t("bookshelf.book.moreStatsHint")}
            </MText>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  cardWrapperRow: { marginRight: spacing.md },
  cardWrapperGrid: {
    marginRight: 0,
    marginBottom: 0,
  },

  cardOuter: {
    position: "relative",
  },

  nameplateWrap: {
    position: "absolute",
    bottom: spacing.sm,
    zIndex: 8,
  },

  cardBase: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: "hidden",
    flexDirection: "column",
  },

  cardRow: { aspectRatio: 0.8 },
  cardGrid: { aspectRatio: 0.8 },

  body: {
    position: "relative",
    flex: 1,
  },

  coverClip: {
    position: "absolute",
    top: spacing.sm + 4,
    left: 22,
    right: spacing.lg,
    bottom: spacing.sm + BOOK_NAMEPLATE_HEIGHT - 4,
    borderRadius: radii.sm,
    overflow: "hidden",
    zIndex: 1,
  },
  coverImg: { width: "100%", height: "100%" },

  bookSpine: {
    position: "absolute",
    left: 0,
    top: spacing.sm,
    bottom: spacing.sm,
    width: 14,
    borderTopLeftRadius: radii.lg,
    borderBottomLeftRadius: radii.lg,
    borderRightWidth: StyleSheet.hairlineWidth,
    zIndex: 3,
  },
  bookSpineHighlight: {
    position: "absolute",
    left: 14,
    top: spacing.sm,
    bottom: spacing.sm,
    width: 4,
    borderTopLeftRadius: radii.lg,
    borderBottomLeftRadius: radii.lg,
    backgroundColor: "rgba(255,255,255,0.16)",
    zIndex: 3,
  },
  bookPageEdgeTop: {
    position: "absolute",
    top: spacing.sm,
    left: 22,
    right: spacing.sm,
    height: 4,
    borderRadius: 4,
    opacity: 0.4,
    zIndex: 4,
  },
  bookPageEdgeRight: {
    position: "absolute",
    top: spacing.sm + 4,
    bottom: spacing.sm,
    right: 0,
    width: spacing.sm,
    zIndex: 5,
  },

  menuIconWrapper: {
    position: "absolute",
    top: spacing.xs,
    right: 0,
    zIndex: 10,
  },
  menuChip: {
    borderRadius: spacing.md,
    overflow: "hidden",
    padding: 1,
    backgroundColor: colors.surface,
  },

  contactShadow: {
    position: "absolute",
    left: 14,
    right: 14,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.18)",
    opacity: 0.28,
    zIndex: 1,
  },

  menuOverlay: { flex: 1, backgroundColor: "transparent" },
  popover: {
    position: "absolute",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
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
  menuItemLabel: {
    flex: 1,
    flexShrink: 1,
  },

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
});
