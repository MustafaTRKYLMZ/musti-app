import React, { FC, useMemo } from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from "react-native-svg";
import { bookshelfTheme } from "/ui-native";

type WoodGrainOverlayProps = {
  opacity?: number; // genel damar opacity
  lineCount?: number; // damar sayısı
  scale?: number; // damar sıkılığı
};

function hash01(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const WoodGrainOverlay: FC<WoodGrainOverlayProps> = ({
  opacity = 0.22,
  lineCount = 22,
  scale = 1,
}) => {
  const c = bookshelfTheme.colors;

  const paths = useMemo(() => {
    const out: Array<{ d: string; o: number; w: number }> = [];
    for (let i = 0; i < lineCount; i++) {
      const seed = 77 + i * 97;
      const y = (i / lineCount) * 100;
      const amp = (1.2 + 3.5 * hash01(seed + 1)) * scale;
      const wig = 0.9 + 1.8 * hash01(seed + 2);

      const x0 = -10;
      const x1 = 25 + 20 * hash01(seed + 3);
      const x2 = 70 + 20 * hash01(seed + 4);
      const x3 = 110;

      const y0 = y + amp * Math.sin((0 + i) * wig);
      const y1 = y + amp * Math.sin((1 + i) * wig);
      const y2 = y + amp * Math.sin((2 + i) * wig);
      const y3 = y + amp * Math.sin((3 + i) * wig);

      const d = `M ${x0} ${y0} C ${x1} ${y1}, ${x2} ${y2}, ${x3} ${y3}`;
      const o = (0.15 + 0.35 * hash01(seed + 5)) * opacity;
      const w = 0.35 + 0.9 * hash01(seed + 6);

      out.push({ d, o, w });
    }
    return out;
  }, [lineCount, scale, opacity]);

  return (
    <Svg
      style={StyleSheet.absoluteFill}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      pointerEvents="none"
    >
      <Defs>
        {/* panel ışık: üstten hafif highlight */}
        <LinearGradient id="panelLight" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={c.surfaceElevated} stopOpacity={0.22} />
          <Stop
            offset="0.55"
            stopColor={c.backgroundSecondary}
            stopOpacity={0.06}
          />
          <Stop offset="1" stopColor={c.shadowStrong} stopOpacity={0.18} />
        </LinearGradient>

        {/* damarların kendi fade'i */}
        <LinearGradient id="grainFade" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={c.shadowStrong} stopOpacity={0.0} />
          <Stop offset="0.18" stopColor={c.shadowStrong} stopOpacity={0.35} />
          <Stop offset="0.82" stopColor={c.shadowStrong} stopOpacity={0.35} />
          <Stop offset="1" stopColor={c.shadowStrong} stopOpacity={0.0} />
        </LinearGradient>
      </Defs>

      {/* panel ışık katmanı */}
      <Rect x="0" y="0" width="100" height="100" fill="url(#panelLight)" />

      {/* damar çizgileri */}
      {paths.map((p, idx) => (
        <Path
          key={idx}
          d={p.d}
          stroke="url(#grainFade)"
          strokeWidth={p.w}
          strokeOpacity={p.o}
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </Svg>
  );
};
