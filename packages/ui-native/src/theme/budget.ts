
import { Theme, ThemeColors } from "./types";
import { spacing, radii, iconSizes, typography, shadows, sizes } from "./tokens";

const budgetColors: ThemeColors = {
  primary: "#002F6C",
  primaryDark: "#001A3D",
  primaryLight: "#0049A8",

  background: "#0A1A4F",
  backgroundSecondary: "#031634",
  backgroundBackdrop: "rgba(10,26,79,0.75)",
  backgroundHover: "#112E5C",

  surface: "#0f172a",
  surfaceElevated: "#FFFFFF",

  textPrimary: "#F1F5F9",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  textInverse: "#FFFFFF",

  success: "#22C55E",
  danger: "#F97373",
  warning: "#FACC15",

  borderSubtle: "rgba(255,255,255,0.12)",
  surfaceStrong: "#0C163A",
  backdropStrong: "rgba(15,23,42,0.75)",
  shadowStrong: "rgba(0,0,0,0.45)",
  statusActive: "#22C55E",
  statusDone: "#94A3B8",
  statusPending: "#FACC15",
  backdrop: "rgba(15,23,42,0.75)",
  border: "rgba(255,255,255,0.12)",
  shadow: "rgba(0,0,0,0.45)",
};

export const budgetTheme: Theme = {
  colors: budgetColors,
  spacing,
  radii,
  iconSizes,
  typography,
  shadows,
  sizes,
};
