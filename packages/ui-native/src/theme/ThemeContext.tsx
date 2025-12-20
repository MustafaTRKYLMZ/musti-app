import React, { createContext, useContext } from "react";
import { budgetTheme } from "./budget";

const ThemeContext = createContext(budgetTheme);

interface ThemeProviderProps {
  theme: typeof budgetTheme;
  children: React.ReactNode;
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
