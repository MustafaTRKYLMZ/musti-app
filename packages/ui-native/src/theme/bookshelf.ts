import { Theme, ThemeColors } from "./types";
import { spacing, radii, iconSizes, typography, shadows } from "./tokens";

const bookshelfColors: ThemeColors = {
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
};


export const bookshelfTheme: Theme = {
  colors: bookshelfColors,
  spacing,
  radii,
  iconSizes,
  typography,
  shadows,
};
