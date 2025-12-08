import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTransactionsStore } from "../store/useTransactionsStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { useEffect } from "react";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  "use no memo";
  const colorScheme = useColorScheme();

  const loadFromStorage = useTransactionsStore((s) => s.loadFromStorage);
  const loadInitialBalance = useSettingsStore((s) => s.loadInitialBalance);

  useEffect(() => {
    loadInitialBalance();
    loadFromStorage();
  }, [loadInitialBalance, loadFromStorage]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Ana tab grubu */}
        <Stack.Screen name="(tabs)" />

        {/* Bookshelf ekranı (root-level) */}
        <Stack.Screen name="bookshelf" />

        {/* PDF grubu: app/pdf/_layout.tsx + viewer.tsx */}
        <Stack.Screen name="pdf" />

        {/* Eğer gerçekten (modals) grubun varsa: */}
        {/* 
        <Stack.Screen
          name="(modals)"
          options={{ presentation: "modal" }}
        />
        */}
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
