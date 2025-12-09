// packages/core/src/theme.ts

export const theme = {
    colors: {
      primary: "#0A1A4F",
      primaryDark: "#050C2C",
      primaryLight: "#132868",
      background: "#0A1A4F",
      surface: "#050C2C",
  
      textPrimary: "#FFFFFF",
      textMuted: "#D1D5DB",
  
      borderSubtle: "rgba(255,255,255,0.22)",
  
      success: "#22c55e",
      danger: "#ef4444",
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
      xxl: 32,
    },
    radius: {
      sm: 6,
      md: 8,
      lg: 12,
      pill: 999,
    },
  } as const;
  
  export type AppTheme = typeof theme;
  