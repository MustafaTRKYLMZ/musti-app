import * as Notifications from "expo-notifications";
import { ensureAndroidChannel } from "./channels";

let didInit = false;

export async function initNotificationsOnce() {
  if (didInit) return;
  didInit = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  

  await ensureAndroidChannel();
}
