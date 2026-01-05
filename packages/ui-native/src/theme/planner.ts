import { Theme, ThemeColors } from "./types";
import { spacing, radii, iconSizes, typography, shadows ,sizes} from "./tokens";

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

const plannerColorsBase = {
  primary: "#16A34A",
  primaryDark: "#166534",
  primaryLight: "#86EFAC",

  // Backgrounds
  background: "#0B1F14", // deep green-black
  backgroundSecondary: "#0F2A1B",
  backgroundHover: "#123321",

  // Overlays
  backgroundBackdrop: "rgba(6, 18, 12, 0.78)",

  // Surfaces (cards, panels)
  surface: "#102819",
  surfaceElevated: "#143020",
  surfaceStrong: "#173A25",

  // Text
  textPrimary: "#E7F6EC",
  textSecondary: "#BFE6CC",
  textMuted: "#86B89A",
  textInverse: "#07140D",

  // Semantic
  success: "#22C55E",
  danger: "#FB7185",
  warning: "#FACC15",

  // Borders & shadows
  borderSubtle: "rgba(120, 255, 170, 0.16)",
  backdropStrong: "rgba(5, 14, 9, 0.80)",
  shadowStrong: "rgba(0,0,0,0.45)",
} as const;

const plannerColors: ThemeColors = {
  ...plannerColorsBase,

  // Status
  statusActive: plannerColorsBase.success,

  statusDone: mixHex(plannerColorsBase.textMuted, plannerColorsBase.surface, 0.45),

  statusPending: mixHex(
    plannerColorsBase.warning,
    plannerColorsBase.surfaceElevated,
    0.55
  ),
};

export const plannerTheme: Theme = {
  colors: plannerColors,
  spacing,
  radii,
  iconSizes,
  typography,
  shadows,
  sizes
};
