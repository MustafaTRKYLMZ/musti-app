import React, { ReactNode, useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import { IconButton } from "@/components/ui/AppIcon";
import { spacing, useTheme, radii, iconSizes } from "@budget/ui-native";

export type StripMode = "vertical" | "horizontal";
export type StripPos = { x: number; y: number };

type FloatingPageStripProps = {
  mode: StripMode;
  minimized: boolean;
  hidden: boolean;

  initialPos?: StripPos;
  onPosChange?: (pos: StripPos) => void;

  onToggleMinimized: () => void;
  onToggleHidden: () => void;
  onToggleMode: () => void;

  children: ReactNode;
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const EDGE_PADDING = 10;
const BOTTOM_SAFE = 24;
const TOP_SAFE = 24;

const defaultPosForMode = (mode: StripMode): StripPos =>
  mode === "vertical"
    ? { x: SCREEN_W - 80, y: SCREEN_H - 260 }
    : { x: (SCREEN_W - 220) / 2, y: SCREEN_H - 170 };

export const FloatingPageStrip = ({
  mode,
  minimized,
  hidden,
  initialPos,
  onPosChange,
  onToggleMinimized,
  onToggleHidden,
  onToggleMode,
  children,
}: FloatingPageStripProps) => {
  const { colors } = useTheme();
  const [boxSize, setBoxSize] = useState({ width: 0, height: 0 });

  const pos = useRef(
    new Animated.ValueXY(initialPos ?? defaultPosForMode(mode))
  ).current;

  // AsyncStorage load sonrası initialPos gelirse uygula
  useEffect(() => {
    if (!initialPos) return;
    pos.setValue({ x: initialPos.x, y: initialPos.y });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPos?.x, initialPos?.y]);

  const snapToDefaultForMode = (nextMode: StripMode) => {
    const to = defaultPosForMode(nextMode);
    Animated.spring(pos, {
      toValue: to,
      useNativeDriver: false,
      tension: 120,
      friction: 16,
    }).start(() => {
      onPosChange?.(to);
    });
  };

  const panResponder = useMemo(() => {
    let startX = 0;
    let startY = 0;

    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) + Math.abs(g.dy) > 3,
      onPanResponderGrant: () => {
        // @ts-ignore
        startX = pos.x._value ?? 0;
        // @ts-ignore
        startY = pos.y._value ?? 0;
      },
      onPanResponderMove: (_, g) => {
        pos.setValue({ x: startX + g.dx, y: startY + g.dy });
      },
      onPanResponderRelease: (_, g) => {
        const rawX = startX + g.dx;
        const rawY = startY + g.dy;

        const bw = boxSize.width || 1;
        const bh = boxSize.height || 1;

        const minX = EDGE_PADDING;
        const maxX = SCREEN_W - bw - EDGE_PADDING;

        const minY = EDGE_PADDING + TOP_SAFE;
        const maxY = SCREEN_H - bh - EDGE_PADDING - BOTTOM_SAFE;

        let x = Math.min(Math.max(rawX, minX), maxX);
        let y = Math.min(Math.max(rawY, minY), maxY);

        if (mode === "vertical") {
          const leftDist = x - minX;
          const rightDist = maxX - x;
          x = leftDist < rightDist ? minX : maxX;
        } else {
          y = maxY;
        }

        const finalPos = { x, y };

        Animated.spring(pos, {
          toValue: finalPos,
          useNativeDriver: false,
          tension: 140,
          friction: 18,
        }).start(() => {
          onPosChange?.(finalPos);
        });
      },
    });
  }, [mode, pos, boxSize.width, boxSize.height, onPosChange]);

  // Hidden mod: sağ-alt sabit göz ikonu
  if (hidden) {
    return (
      <View
        style={[
          styles.hiddenFixed,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <IconButton
          name="eye-outline"
          size={iconSizes.lg}
          onPress={onToggleHidden}
          accessibilityLabel="Show pagination"
        />
      </View>
    );
  }

  return (
    <Animated.View
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setBoxSize({ width, height });
      }}
      style={[styles.floating, { transform: pos.getTranslateTransform() }]}
      {...panResponder.panHandlers}
    >
      <View
        style={[
          styles.shell,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.toolbar}>
          <IconButton
            name={minimized ? "chevron-up" : "chevron-down"}
            size={iconSizes.md}
            onPress={onToggleMinimized}
            accessibilityLabel={
              minimized ? "Expand pagination" : "Collapse pagination"
            }
          />

          <IconButton
            name="swap-horizontal"
            size={iconSizes.md}
            onPress={() => {
              const next = mode === "vertical" ? "horizontal" : "vertical";
              onToggleMode();
              snapToDefaultForMode(next);
            }}
            accessibilityLabel="Switch pagination mode"
          />

          <IconButton
            name="eye-off-outline"
            size={iconSizes.md}
            onPress={onToggleHidden}
            accessibilityLabel="Hide pagination"
          />
        </View>

        <View style={[styles.content, minimized && styles.contentMinimized]}>
          {children}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floating: {
    position: "absolute",
    zIndex: 50,
  },
  shell: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  contentMinimized: {
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  hiddenFixed: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg * 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.full,
    padding: spacing.sm,
    zIndex: 100,
    elevation: 6,
  },
});
