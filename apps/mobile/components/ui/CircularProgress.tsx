import React, { useMemo } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { MText, bookshelfTheme } from "@musti/ui-native";

const { colors, radii } = bookshelfTheme;

type Props = {
  size?: number; // px
  stroke?: number; // px
  value: number; // 0..1
  labelTop?: string; // e.g. "8/10"
  labelBottom?: string; // e.g. "today"
  style?: ViewStyle;
  progressColor?: string;
  trackColor?: string;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function CircularProgress({
  size = 60,
  stroke = 12,
  value,
  labelTop,
  labelBottom,
  style,
  progressColor,
  trackColor,
}: Props) {
  const v = clamp01(value);
  const progressStroke = progressColor ?? colors.danger;
  const trackStroke = trackColor ?? colors.borderSubtle;
  const { r, c, dash } = useMemo(() => {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - v);
    return { r: radius, c: circumference, dash: dashOffset };
  }, [size, stroke, v]);

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFillObject}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="transparent"
          stroke={trackStroke}
        />
        {/* Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={progressStroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={dash}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>

      <View style={styles.center}>
        {labelTop ? (
          <MText style={styles.top} numberOfLines={1}>
            {labelTop}
          </MText>
        ) : null}
        {labelBottom ? (
          <MText style={styles.bottom} numberOfLines={1}>
            {labelBottom}
          </MText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  top: {
    fontWeight: "900",
    fontSize: 12,
  },
  bottom: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 1,
  },
});
