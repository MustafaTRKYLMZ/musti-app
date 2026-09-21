import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { syncAllGoogleCalendars } from "@/services/googleCalendar/syncGoogleCalendars";
import { useCalendarSourcesStore } from "@/store/calendar/useCalendarSourcesStore";

const AUTO_SYNC_INTERVAL_MS = 15 * 60 * 1000;

export function useCalendarSync(enabled: boolean) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const lastRunRef = useRef(0);

  const accounts = useCalendarSourcesStore((s) => s.accounts);
  const hasHydrated = useCalendarSourcesStore((s) => s.hasHydrated);

  const syncNow = useCallback(async () => {
    if (accounts.length === 0) {
      return { syncedFeeds: 0, importedEvents: 0, errors: [] };
    }

    setIsSyncing(true);
    setLastError(null);
    try {
      const result = await syncAllGoogleCalendars();
      if (result.errors.length > 0) {
        setLastError(result.errors.join("\n"));
      }
      lastRunRef.current = Date.now();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      setLastError(message);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [accounts.length]);

  useEffect(() => {
    if (!enabled || !hasHydrated || accounts.length === 0) return;

    const maybeSync = (force = false) => {
      if (
        !force &&
        Date.now() - lastRunRef.current < AUTO_SYNC_INTERVAL_MS
      ) {
        return;
      }
      void syncNow();
    };

    maybeSync(true);

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        maybeSync();
      }
    });

    return () => sub.remove();
  }, [enabled, hasHydrated, accounts.length, syncNow]);

  return { syncNow, isSyncing, lastError };
}
