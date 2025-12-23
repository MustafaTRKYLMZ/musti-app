import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTransactionsStore } from "../store/budget/transactions/useTransactionsStore";
import { useSettingsStore } from "../store/budget/useSettingsStore";
import { useEffect } from "react";
import { initNotificationsOnce } from "@budget/notifications";
import { SchedulersHost } from "@/components/SchedulersHost";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ToastProvider } from "@/components/ui/ToastProvider";

import * as Notifications from "expo-notifications";
import {
  routeFromNotificationPayload,
  type RouteTo,
} from "../utils/routeFromPayload";

export const unstable_settings = {
  anchor: "(tabs)",
};

// ✅ Must be outside component
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const loadFromStorage = useTransactionsStore((s) => s.loadFromStorage);
  const loadInitialBalance = useSettingsStore((s) => s.loadInitialBalance);

  useEffect(() => {
    initNotificationsOnce();
  }, []);

  useEffect(() => {
    loadInitialBalance();
    loadFromStorage();
  }, [loadInitialBalance, loadFromStorage]);

  // ✅ notification click → deep link routing
  useEffect(() => {
    let sub: Notifications.Subscription | null = null;

    const pushRoute = (to: RouteTo) => {
      if (typeof to === "string") {
        router.push(to as any);
      } else {
        router.push(to as any);
      }
    };

    const handleResponse = (response: Notifications.NotificationResponse) => {
      const data = response?.notification?.request?.content?.data as any;
      const payload = data?.payload;

      if (!payload) return;

      const to = routeFromNotificationPayload(payload);
      pushRoute(to);
    };

    (async () => {
      const last = await Notifications.getLastNotificationResponseAsync();
      if (last) handleResponse(last);
    })();

    sub = Notifications.addNotificationResponseReceivedListener(handleResponse);

    return () => {
      if (sub) sub.remove();
    };
  }, [router]);

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
