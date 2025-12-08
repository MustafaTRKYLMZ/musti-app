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
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="bookshelf" />
        <Stack.Screen name="pdf" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
