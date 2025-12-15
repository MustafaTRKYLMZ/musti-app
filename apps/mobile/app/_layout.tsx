import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "expo-notifications";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTransactionsStore } from "../store/budget/transactions/useTransactionsStore";
import { useSettingsStore } from "../store/budget/useSettingsStore";
import { useEffect } from "react";
import { initNotificationsOnce } from "@budget/notifications";
import { SchedulersHost } from "@/components/SchedulersHost";
export const unstable_settings = {
  anchor: "(tabs)",
};

useEffect(() => {
  initNotificationsOnce();
}, []);

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
      <SchedulersHost />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="launcher" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
