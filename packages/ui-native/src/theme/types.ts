export type ThemeColors = {
    primary: string;
    primaryDark: string;
    primaryLight: string;
  
    background: string;
    backgroundSecondary: string;
    backgroundBackdrop: string;
    backgroundHover: string;
  
    surface: string;
    surfaceElevated: string;
  
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;
  
    success: string;
    danger: string;
    warning: string;
  
    borderSubtle: string;
    surfaceStrong: string;
    backdropStrong: string;
    shadowStrong: string;

    statusActive: string;
    statusDone: string;
    statusPending: string;
    backdrop: string;
    border: string;
    shadow: string;
  };
  
  export type TypographyVariant = {
    fontSize: number;
    lineHeight: number;
    fontWeight: "400" | "600" | "700";
  };
  
  export type Typography = {
    heading1: TypographyVariant;
    heading2: TypographyVariant;
    heading3: TypographyVariant;
    heading4: TypographyVariant;
    body: TypographyVariant;
    bodyStrong: TypographyVariant;
    caption: TypographyVariant;
  };
  
  export type ThemeTokens = {
    iconSizes: typeof import("./tokens").iconSizes;
    spacing: typeof import("./tokens").spacing;
    radii: typeof import("./tokens").radii;
    typography: Typography;
    shadows: typeof import("./tokens").shadows;
    sizes: typeof import("./tokens").sizes;
  };
  
  export type Theme = ThemeTokens & {
    colors: ThemeColors;
  };
  