import { useEffect } from "react";
import {
  cancelScheduledByOwner,
  ensureNotificationPermission,
  scheduleDailyReminder,
} from "@musti/notifications";
import { useBudgetNotificationSettingsStore } from "./useNotificationSettingsStore";

export function useBudgetNotificationScheduler() {
  const enabled = useBudgetNotificationSettingsStore((s) => s.enabled);
  const hour = useBudgetNotificationSettingsStore((s) => s.hour);
  const minute = useBudgetNotificationSettingsStore((s) => s.minute);

  useEffect(() => {
    let disposed = false;

    const run = async () => {
      await cancelScheduledByOwner("budget");

      if (!enabled) return;

      const ok = await ensureNotificationPermission();
      if (!ok) return;
      if (disposed) return;

      try {
        await scheduleDailyReminder({
          owner: "budget",
          hour,
          minute,
          title: "Bütçe kontrol zamanı",
          body: "Bugünkü harcamalarını 1 dk gözden geçir 👀",
          kind: "daily-budget",
        });
      } catch (e) {
        console.warn("Failed to schedule budget reminder", e);
      }
    };

    run();

    return () => {
      disposed = true;
    };
  }, [enabled, hour, minute]);
}
