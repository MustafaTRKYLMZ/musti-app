import { Theme, ThemeColors } from "./types";
import { spacing, radii, iconSizes, typography, shadows } from "./tokens";

const hexToRgb = (hex: string) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((v) =>
      Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")
    )
    .join("")}`;

const mixHex = (a: string, b: string, t: number) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const tt = Math.max(0, Math.min(1, t));
  return rgbToHex(
    A.r + (B.r - A.r) * tt,
    A.g + (B.g - A.g) * tt,
    A.b + (B.b - A.b) * tt
  );
};

const bookshelfColorsBase = {
  primary: "#C53030",
  primaryDark: "#7F1D1D",
  primaryLight: "#F97373",

  background: "#2C1810",
  backgroundSecondary: "#4B2A16",
  backgroundBackdrop: "rgba(22, 12, 6, 0.85)",
  backgroundHover: "#5A3721",

  surface: "#D9B891",
  surfaceElevated: "#E5C9A8",

  textPrimary: "#2F241B",
  textSecondary: "#5A4B3C",
  textMuted: "#8D7A66",
  textInverse: "#FDF4E3",

  success: "#22C55E",
  danger: "#F97373",
  warning: "#FACC15",

  borderSubtle: "rgba(120, 68, 30, 0.35)",
  surfaceStrong: "#E5C9A8",
  backdropStrong: "rgba(15, 10, 5, 0.75)",
  shadowStrong: "rgba(0,0,0,0.45)",
} as const;

const bookshelfColors: ThemeColors = {
  ...bookshelfColorsBase,


  statusActive: bookshelfColorsBase.success,

  statusDone: mixHex(
    bookshelfColorsBase.textMuted,
    bookshelfColorsBase.backgroundSecondary,
    0.35
  ),

  statusPending: mixHex(
    bookshelfColorsBase.warning,
    bookshelfColorsBase.surface,
    0.55
  ),
};

export const bookshelfTheme: Theme = {
  colors: bookshelfColors,
  spacing,
  radii,
  iconSizes,
  typography,
  shadows,
};
