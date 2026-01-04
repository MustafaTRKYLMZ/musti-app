import { useEffect, useRef } from "react";
import {
  cancelNotificationIds,
  ensureNotificationPermission,
  scheduleCustomReminder,
} from "@musti/notifications";
import { useRemindersStore } from "@/store/reminders/useRemindersStore";
import type { ReminderItem, ReminderOwner } from "@/store/reminders/types";

function stableHash(rem: ReminderItem) {
  // SADECE kullanıcı verisi
  return JSON.stringify({
    enabled: rem.enabled,
    title: rem.title,
    body: rem.body,
    schedule: rem.schedule,
    target: rem.target,
  });
}

export function useReminderScheduler(owner: ReminderOwner) {
  const signature = useRemindersStore((s) =>
    s.reminders
      .filter((r) => r.owner === owner)
      .map((r) => `${r.id}:${stableHash(r)}`)
      .join("|")
  );

  const setNotificationIds = useRemindersStore((s) => s.setNotificationIds);
  const clearNotificationIds = useRemindersStore((s) => s.clearNotificationIds);
  const setScheduledHash = useRemindersStore((s) => s.setScheduledHash);

  const running = useRef(new Set<string>());

  useEffect(() => {
    let disposed = false;

    const run = async () => {
      const state = useRemindersStore.getState();
      const reminders = state.reminders.filter((r) => r.owner === owner);

      const anyEnabled = reminders.some((r) => r.enabled);
      if (anyEnabled) {
        const ok = await ensureNotificationPermission();
        if (!ok) return;
      }

      for (const rem of reminders) {
        if (disposed) return;
        if (running.current.has(rem.id)) continue;
        running.current.add(rem.id);

        try {
          const hash = stableHash(rem);

          if (!rem.enabled) {
            if (rem.notificationIds.length) {
              await cancelNotificationIds(rem.notificationIds);
              clearNotificationIds(rem.id);
            }
            if (rem.scheduledHash) setScheduledHash(rem.id, undefined);
            continue;
          }

          if (rem.scheduledHash === hash && rem.notificationIds.length > 0) {
            continue;
          }

        
          if (rem.scheduledHash === hash && rem.notificationIds.length === 0) {
            const notifId = await scheduleCustomReminder({
              id: rem.id,
              owner: rem.owner,
              title: rem.title,
              body: rem.body,
              schedule: rem.schedule,
            });
            setNotificationIds(rem.id, [notifId]);
            continue;
          }

          if (rem.notificationIds.length) {
            await cancelNotificationIds(rem.notificationIds);
          }

          const notifId = await scheduleCustomReminder({
            id: rem.id,
            owner: rem.owner,
            title: rem.title,
            body: rem.body,
            schedule: rem.schedule,
          });

          // ✅ önce hash, sonra ids (debug daha stabil)
          setScheduledHash(rem.id, hash);
          setNotificationIds(rem.id, [notifId]);
        } catch (e) {
          console.warn(`[reminders] schedule failed (${owner})`, rem.id, e);
        } finally {
          running.current.delete(rem.id);
        }
      }
    };

    run();
    return () => {
      disposed = true;
    };
  }, [owner, signature, setNotificationIds, clearNotificationIds, setScheduledHash]);
}
