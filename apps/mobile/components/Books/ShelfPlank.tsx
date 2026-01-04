import React, { FC, useMemo } from "react";
import Svg, {
  Polygon,
  Rect,
  Defs,
  LinearGradient,
  Stop,
  ClipPath,
} from "react-native-svg";
import { bookshelfTheme } from "/ui-native";

type ShelfPlankProps = {
  width?: number;
  height?: number;
  thickness?: number;
  depth?: number;
  skewX?: number;
  skewY?: number;

  radius?: number;
  strokeWidth?: number;
  brightness?: number;

  accent?: boolean;
  accentHeight?: number;
  accentGlow?: boolean;

  idSuffix?: string;
};

export const ShelfPlank: FC<ShelfPlankProps> = ({
  width = 320,
  height = 92,
  thickness = 16,
  depth = 28,
  skewX = 18,
  skewY = 10,

  radius = 4,
  strokeWidth = 0.6,
  brightness = 0.75,

  accent = true,
  accentHeight = 2,
  accentGlow = false,

  idSuffix = "0",
}) => {
  const c = bookshelfTheme.colors;

  const t = Math.min(thickness, height - 10);
  const d = Math.min(depth, 90);
  const topY = skewY + 10;

  const pts = useMemo(() => {
    const w = width;

    const F1 = { x: 0, y: topY };
    const F2 = { x: w, y: topY };
    const F3 = { x: w, y: topY + t };
    const F4 = { x: 0, y: topY + t };

    const B1 = { x: F1.x + skewX, y: F1.y - d };
    const B2 = { x: F2.x + skewX, y: F2.y - d };

    const ah = Math.max(2, Math.min(accentHeight, t - 2));

    return {
      F1,
      F2,
      F3,
      F4,
      B1,
      B2,
      top: [F1, F2, B2, B1],
      side: [F2, B2, { x: B2.x, y: B2.y + t }, F3],
      frontRect: { x: 0, y: topY, w, h: t },

      accentRect: { x: 0, y: F4.y - ah, w, h: ah },
      glowRect: { x: 0, y: F4.y - ah - 2, w, h: ah + 4 },
    };
  }, [width, topY, t, d, skewX, accentHeight]);

  const toStr = (a: { x: number; y: number }[]) =>
    a.map((p) => `${p.x},${p.y}`).join(" ");

  const topOverlayOpacity = 0.55 + 0.25 * brightness;
  const frontOverlayOpacity = 0.5 + 0.2 * brightness;
  const sideOpacity = 0.85 + 0.1 * brightness;
  const borderOpacity = 0.18;

  const r = Math.min(radius, pts.frontRect.h / 2);

  // ✅ unique ids
  const topLightId = `topLight-${idSuffix}`;
  const frontShadeId = `frontShade-${idSuffix}`;
  const accentLineId = `accentLine-${idSuffix}`;
  const topContactId = `topContact-${idSuffix}`;
  const frontClipId = `frontClip-${idSuffix}`;
  const topClipId = `topClip-${idSuffix}`;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id={topLightId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={c.surfaceElevated} stopOpacity={0.8} />
          <Stop offset="0.55" stopColor={c.surface} stopOpacity={0.22} />
          <Stop
            offset="1"
            stopColor={c.backgroundSecondary}
            stopOpacity={0.55}
          />
        </LinearGradient>

        <LinearGradient id={frontShadeId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={c.surface} stopOpacity={0.18} />
          <Stop
            offset="1"
            stopColor={c.backgroundSecondary}
            stopOpacity={0.55}
          />
        </LinearGradient>

        <LinearGradient id={accentLineId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={c.borderSubtle} stopOpacity={0.7} />
          <Stop offset="1" stopColor={c.shadowStrong} stopOpacity={0.35} />
        </LinearGradient>

        <LinearGradient id={topContactId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={c.shadowStrong} stopOpacity={0.0} />
          <Stop offset="0.35" stopColor={c.shadowStrong} stopOpacity={0.18} />
          <Stop offset="1" stopColor={c.shadowStrong} stopOpacity={0.0} />
        </LinearGradient>

        <ClipPath id={frontClipId}>
          <Rect
            x={pts.frontRect.x}
            y={pts.frontRect.y}
            width={pts.frontRect.w}
            height={pts.frontRect.h}
            rx={r}
            ry={r}
          />
        </ClipPath>

        <ClipPath id={topClipId}>
          <Rect
            x={0}
            y={Math.max(0, pts.F1.y - d - 6)}
            width={width + Math.max(0, skewX) + 8}
            height={d + t + 16}
            rx={r}
            ry={r}
          />
        </ClipPath>
      </Defs>

      <Polygon
        points={toStr(pts.top)}
        fill={c.backgroundSecondary}
        opacity={0.88 + 0.08 * brightness}
        stroke={`rgba(120, 68, 30, ${borderOpacity})`}
        strokeWidth={strokeWidth}
        clipPath={`url(#${topClipId})`}
      />
      <Polygon
        points={toStr(pts.top)}
        fill={`url(#${topLightId})`}
        opacity={topOverlayOpacity}
        clipPath={`url(#${topClipId})`}
      />

      <Rect
        x={0}
        y={pts.F1.y - 2}
        width={width}
        height={6}
        fill={`url(#${topContactId})`}
        opacity={0.55}
        rx={r}
        ry={r}
      />

      <Polygon
        points={toStr(pts.side)}
        fill={c.background}
        opacity={sideOpacity}
        stroke={`rgba(120, 68, 30, ${borderOpacity})`}
        strokeWidth={strokeWidth}
      />

      <Rect
        x={pts.frontRect.x}
        y={pts.frontRect.y}
        width={pts.frontRect.w}
        height={pts.frontRect.h}
        rx={r}
        ry={r}
        fill={c.backgroundHover}
        opacity={0.86 + 0.1 * brightness}
        stroke={`rgba(120, 68, 30, ${borderOpacity})`}
        strokeWidth={strokeWidth}
      />
      <Rect
        x={pts.frontRect.x}
        y={pts.frontRect.y}
        width={pts.frontRect.w}
        height={pts.frontRect.h}
        rx={r}
        ry={r}
        fill={`url(#${frontShadeId})`}
        opacity={frontOverlayOpacity}
      />

      {accentGlow && (
        <Rect
          clipPath={`url(#${frontClipId})`}
          x={pts.glowRect.x}
          y={pts.glowRect.y}
          width={pts.glowRect.w}
          height={pts.glowRect.h}
          fill={`url(#${accentLineId})`}
          opacity={0.12}
          rx={r}
          ry={r}
        />
      )}

      {accent && (
        <Rect
          clipPath={`url(#${frontClipId})`}
          x={pts.accentRect.x}
          y={pts.accentRect.y}
          width={pts.accentRect.w}
          height={pts.accentRect.h}
          fill={`url(#${accentLineId})`}
          opacity={0.55}
          rx={r}
          ry={r}
        />
      )}
    </Svg>
  );
};
