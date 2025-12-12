import React, { ReactNode, useMemo, useRef, useState } from "react";
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

type FloatingPageStripProps = {
  mode: StripMode;
  minimized: boolean;
  onToggleMinimized: () => void;
  onToggleMode: () => void;
  children: ReactNode;
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const EDGE_PADDING = 10;
const BOTTOM_SAFE = 24; // istersen sonra SafeAreaInsets yaparız
const TOP_SAFE = 24;

export const FloatingPageStrip = ({
  mode,
  minimized,
  onToggleMinimized,
  onToggleMode,
  children,
}: FloatingPageStripProps) => {
  const { colors } = useTheme();
  const [boxSize, setBoxSize] = useState({ width: 0, height: 0 });

  const pos = useRef(
    new Animated.ValueXY(
      mode === "vertical"
        ? { x: SCREEN_W - 80, y: SCREEN_H - 260 }
        : { x: (SCREEN_W - 220) / 2, y: SCREEN_H - 170 }
    )
  ).current;

  const snapToDefaultForMode = (nextMode: StripMode) => {
    const to =
      nextMode === "vertical"
        ? { x: SCREEN_W - 80, y: SCREEN_H - 260 }
        : { x: (SCREEN_W - 220) / 2, y: SCREEN_H - 170 };

    Animated.spring(pos, {
      toValue: to,
      useNativeDriver: false,
      tension: 120,
      friction: 16,
    }).start();
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

        Animated.spring(pos, {
          toValue: { x, y },
          useNativeDriver: false,
          tension: 140,
          friction: 18,
        }).start();
      },
    });
  }, [mode, pos, boxSize.width, boxSize.height]);

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
        {/* Toolbar */}
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
        </View>

        {/* ✅ Minimized modda da children görünür (sadece daha kompakt padding) */}
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
});
