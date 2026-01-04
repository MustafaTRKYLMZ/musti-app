import { useEffect } from "react";
import {
  cancelScheduledByOwner,
  ensureNotificationPermission,
  scheduleDailyReminder,
} from "/notifications";
import { useBookshelfNotificationSettingsStore } from "./useNotificationSettingsStore";

export function useBookshelfNotificationScheduler() {
  const enabled = useBookshelfNotificationSettingsStore((s) => s.enabled);
  const hour = useBookshelfNotificationSettingsStore((s) => s.hour);
  const minute = useBookshelfNotificationSettingsStore((s) => s.minute);

  useEffect(() => {
    let disposed = false;

    const run = async () => {
      await cancelScheduledByOwner("bookshelf");

      if (!enabled) return;

      const ok = await ensureNotificationPermission();
      if (!ok) return;
      if (disposed) return;

      try {
        await scheduleDailyReminder({
          owner: "bookshelf",
          hour,
          minute,
          title: "Okuma zamanı",
          body: "Bookshelf: Bugünkü hedefin için 10 dk ayır 👀",
          kind: "daily-reading",
        });
      } catch (e) {
        console.warn("Failed to schedule bookshelf reminder", e);
      }
    };

    run();

    return () => {
      disposed = true;
    };
  }, [enabled, hour, minute]);
}
