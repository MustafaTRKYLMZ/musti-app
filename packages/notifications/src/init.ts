import * as Notifications from "expo-notifications";

let inited = false;

export function initNotificationsOnce() {
  if (inited) return;
  inited = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,

        // ✅ Newer expo types
        shouldShowBanner: true,
        shouldShowList: true,
      } as any;
    },
  });
}
