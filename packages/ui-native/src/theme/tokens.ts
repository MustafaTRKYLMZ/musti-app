
export const iconSizes = {
    xs: 14,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
  } as const;
  
  export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    "2xl": 32,
    "3xl": 40,
    "4xl": 48,
    "5xl": 64,
    "6xl": 80,
  } as const;
  export const sizes = {
    xs: 8,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    "2xl": 20,
    "3xl": 24,
    "4xl": 28,
    "5xl": 32,
    "6xl": 36,

  } as const;
  
  export const radii = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    "2xl": 32,
    "3xl": 40,
    "4xl": 48,
    full: 999,
  } as const;
  
  export const typography = {
    heading1: { fontSize: 24, lineHeight: 32, fontWeight: "700" as const },
    heading2: { fontSize: 20, lineHeight: 28, fontWeight: "700" as const },
    heading3: { fontSize: 18, lineHeight: 24, fontWeight: "600" as const },
    heading4: { fontSize: 16, lineHeight: 22, fontWeight: "600" as const },
    body: { fontSize: 16, lineHeight: 22, fontWeight: "400" as const },
    bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: "600" as const },
    caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
  } as const;
  
  export const shadows = {
    card: {
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    modal: {
      color: "rgba(0,0,0,0.45)",
      radius: 18,
      offset: { width: 0, height: -6 },
    },
  } as const;
  
  export const gradients = {
    bookshelfBackground: [
      "#D3A15A",
      "#B57C41", 
      "#8A5A30",
    ],
  
    shelfBoard: [
      "#9C6738",
      "#D8AC6B",
    ],
  } as const;
  