import React, { useEffect, useMemo } from "react";
import dayjs from "dayjs";

import { useRemindersStore } from "@/store/reminders/useRemindersStore";
import type { ReminderItem } from "@/store/reminders/types";

import {
  scheduleCustomReminder,
  cancelNotificationIds,
} from "@budget/notifications";
import type { NotificationPayload } from "@budget/notifications";

function simpleHash(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return String(h);
}

function buildPayload(rem: ReminderItem): NotificationPayload {
  const t = rem.target;

  if (t.type === "book") {
    return {
      v: 1,
      link: { kind: "normal", bookUri: t.bookUri, bookName: t.bookName },
    };
  }

  if (t.type === "plan") {
    return { v: 1, link: { kind: "plan", planId: t.planId } };
  }

  if (t.type === "target") {
    return { v: 1, link: { kind: "target", targetId: t.targetId } };
  }

  // weeklyReport/general -> generic (istersen sonra weeklyReport ekleriz)
  return { v: 1, kind: "generic" };
}

function computeScheduleHash(rem: ReminderItem) {
  // schedule + content + target + enabled
  const obj = {
    enabled: rem.enabled,
    title: rem.title,
    body: rem.body,
    schedule: rem.schedule,
    target: rem.target,
    owner: rem.owner,
  };
  return simpleHash(JSON.stringify(obj));
}

async function ensureOneReminder(rem: ReminderItem) {
  // disabled -> cancel and clear
  if (!rem.enabled) {
    if (rem.notificationIds?.length) {
      await cancelNotificationIds(rem.notificationIds);
    }
    return { ids: [], hash: undefined as string | undefined };
  }

  // once in the past -> do not schedule
  if (rem.schedule.type === "once") {
    const ts = rem.schedule.timestamp;
    if (!Number.isFinite(ts) || ts <= Date.now()) {
      if (rem.notificationIds?.length) {
        await cancelNotificationIds(rem.notificationIds);
      }
      return { ids: [], hash: undefined as string | undefined };
    }
  }

  const nextHash = computeScheduleHash(rem);
  if (rem.scheduledHash === nextHash && rem.notificationIds?.length) {
    // already scheduled
    return { ids: rem.notificationIds, hash: rem.scheduledHash };
  }

  // re-schedule: cancel old ids first
  if (rem.notificationIds?.length) {
    await cancelNotificationIds(rem.notificationIds);
  }

  const payload = buildPayload(rem);

  const id = await scheduleCustomReminder({
    id: rem.id,
    owner: rem.owner,
    title: rem.title,
    body: rem.body,
    schedule: rem.schedule as any,
    payload,
  });

  return { ids: [id], hash: nextHash };
}

export function SchedulersHost() {
  const reminders = useRemindersStore((s) => s.reminders);
  const setNotificationIds = useRemindersStore((s) => s.setNotificationIds);
  const clearNotificationIds = useRemindersStore((s) => s.clearNotificationIds);
  const setScheduledHash = useRemindersStore((s) => s.setScheduledHash);

  // today değişimine gerek yok ama debugging kolay olsun diye
  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);

  useEffect(() => {
    let alive = true;

    (async () => {
      for (const r of reminders) {
        if (!alive) return;

        try {
          const res = await ensureOneReminder(r);
          if (!alive) return;

          if (!res.ids.length) {
            if (r.notificationIds?.length) clearNotificationIds(r.id);
            setScheduledHash(r.id, res.hash);
          } else {
            setNotificationIds(r.id, res.ids);
            setScheduledHash(r.id, res.hash);
          }
        } catch {
          // scheduling fail: keep state as-is (istersen toast/log)
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [
    reminders,
    setNotificationIds,
    clearNotificationIds,
    setScheduledHash,
    today,
  ]);

  return null;
}
