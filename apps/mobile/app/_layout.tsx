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
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ToastProvider } from "@/components/ui/ToastProvider";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const loadFromStorage = useTransactionsStore((s) => s.loadFromStorage);
  const loadInitialBalance = useSettingsStore((s) => s.loadInitialBalance);

  // ✅ Hooks inside component
  useEffect(() => {
    initNotificationsOnce();
  }, []);

  useEffect(() => {
    loadInitialBalance();
    loadFromStorage();
  }, [loadInitialBalance, loadFromStorage]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <ToastProvider>
          <SchedulersHost />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="launcher" />
          </Stack>
          <StatusBar style="auto" />
        </ToastProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
