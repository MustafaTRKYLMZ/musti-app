import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useRootNavigationState } from "expo-router";
import React, { useEffect, useRef } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { SchedulersHost } from "@/components/SchedulersHost";

import Constants from "expo-constants";
import {
  routeFromNotificationPayload,
  type RouteTo,
} from "@/utils/routeFromPayload";

const notificationsEnabled = Constants.appOwnership !== "expo";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  // ✅ nav ready gate
  const navState = useRootNavigationState();
  const pendingRouteRef = useRef<RouteTo | null>(null);

  // ✅ if we got a pending route, push it only when nav is ready
  useEffect(() => {
    if (!navState?.key) return;
    if (!pendingRouteRef.current) return;

    const to = pendingRouteRef.current;
    pendingRouteRef.current = null;

    router.push(to as any);
  }, [navState?.key, router]);

  useEffect(() => {
    if (!notificationsEnabled) return;

    let sub: { remove: () => void } | null = null;
    let cancelled = false;

    const handleResponse = (response: {
      notification?: { request?: { content?: { data?: unknown } } };
    }) => {
      const data = response?.notification?.request?.content?.data as {
        payload?: unknown;
      };
      const payload = data?.payload;

      if (!payload) return;

      const to = routeFromNotificationPayload(payload);

      if (!navState?.key) {
        pendingRouteRef.current = to;
        return;
      }

      router.push(to as any);
    };

    void (async () => {
      const Notifications = await import("expo-notifications");
      if (cancelled) return;

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      const last = await Notifications.getLastNotificationResponseAsync();
      if (last) handleResponse(last);

      sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [router, navState?.key]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <ToastProvider>
          <SchedulersHost />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="launcher" />
          </Stack>
        </ToastProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
