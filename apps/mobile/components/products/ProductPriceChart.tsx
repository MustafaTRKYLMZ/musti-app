import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Polyline, Circle, Line } from "react-native-svg";
import type { PriceSeriesPoint } from "@musti/core";
import { MText, colors, spacing, radii } from "@musti/ui-native";

type Props = {
  points: PriceSeriesPoint[];
  width: number;
  height?: number;
  color?: string;
  emptyLabel: string;
};

export function ProductPriceChart({
  points,
  width,
  height = 168,
  color = colors.primary,
  emptyLabel,
}: Props) {
  const chart = useMemo(() => {
    if (points.length === 0) return null;

    const padding = { top: 12, right: 12, bottom: 24, left: 12 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const prices = points.map((p) => p.unitPrice);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const spread = max - min || 1;

    const coords = points.map((point, index) => {
      const x =
        padding.left +
        (points.length === 1
          ? innerW / 2
          : (index / (points.length - 1)) * innerW);
      const y =
        padding.top + innerH - ((point.unitPrice - min) / spread) * innerH;
      return { x, y, point };
    });

    const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");

    return { coords, polyline, min, max, padding, innerH };
  }, [points, width, height]);

  if (!chart) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <MText variant="caption" color="textSecondary">
          {emptyLabel}
        </MText>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { width, height }]}>
      <MText variant="caption" color="textSecondary" style={styles.minLabel}>
        {chart.min.toFixed(2)}
      </MText>
      <MText variant="caption" color="textSecondary" style={styles.maxLabel}>
        {chart.max.toFixed(2)}
      </MText>

      <Svg width={width} height={height}>
        <Line
          x1={chart.padding.left}
          y1={height - chart.padding.bottom}
          x2={width - chart.padding.right}
          y2={height - chart.padding.bottom}
          stroke={colors.borderSubtle}
          strokeWidth={1}
        />

        {points.length > 1 ? (
          <Polyline
            points={chart.polyline}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}

        {chart.coords.map(({ x, y, point }) => (
          <Circle
            key={`${point.date}_${point.unitPrice}`}
            cx={x}
            cy={y}
            r={4}
            fill={color}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    overflow: "hidden",
  },
  empty: {
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
  },
  minLabel: {
    position: "absolute",
    left: spacing.sm,
    bottom: spacing.xs,
    zIndex: 1,
  },
  maxLabel: {
    position: "absolute",
    left: spacing.sm,
    top: spacing.xs,
    zIndex: 1,
  },
});
