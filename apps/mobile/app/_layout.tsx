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

import * as Notifications from "expo-notifications";
import {
  routeFromNotificationPayload,
  type RouteTo,
} from "@/utils/routeFromPayload";

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
    let sub: Notifications.Subscription | null = null;

    const handleResponse = (response: Notifications.NotificationResponse) => {
      const data = response?.notification?.request?.content?.data as any;
      const payload = data?.payload;

      //     if (!payload) return;

      const to = routeFromNotificationPayload(payload);

      // ✅ if nav not ready yet, store it
      if (!navState?.key) {
        pendingRouteRef.current = to;
        return;
      }

      router.push(to as any);
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
          </Stack>
        </ToastProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
