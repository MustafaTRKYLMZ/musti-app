import React, { useMemo } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "@musti/ui-native";

type Props = {
  value: number;
  total: number;
  width?: number; // px
  height?: number;
  style?: StyleProp<ViewStyle>;
  fillColor?: string;
  trackColor?: string;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const hexToRgb = (hex: string) => {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const lerpColor = (from: string, to: string, t: number) => {
  const A = hexToRgb(from);
  const B = hexToRgb(to);
  return rgbToHex(
    Math.round(lerp(A.r, B.r, t)),
    Math.round(lerp(A.g, B.g, t)),
    Math.round(lerp(A.b, B.b, t))
  );
};

export function getProgressColor(pct01: number, colors: any) {
  const pct = clamp01(pct01);

  const warning = colors.warning ?? "#F4C430";
  const success = colors.success ?? "#22C55E";

  const t = pct <= 0.8 ? pct / 0.8 : 1;
  return lerpColor(warning, success, t);
}

export function ProgressPill({
  value,
  total,
  width = 90,
  height = 6,
  style,
  fillColor,
  trackColor,
}: Props) {
  const { colors } = useTheme();
  const safeTotal = Math.max(1, total || 1);
  const pct = clamp01(value / safeTotal);

  const computedFill = useMemo(
    () => getProgressColor(pct, colors),
    [pct, colors]
  );

  const finalFill = fillColor ?? computedFill;
  const finalTrack = trackColor ?? colors.backgroundSecondary;

  return (
    <View
      style={[
        styles.track,
        { width, height, backgroundColor: finalTrack },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          { width: `${Math.round(pct * 100)}%`, backgroundColor: finalFill },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
});
