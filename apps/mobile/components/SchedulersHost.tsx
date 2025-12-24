import React, { useEffect, useMemo, useRef } from "react";

import { useRemindersStore } from "@/store/reminders/useRemindersStore";
import type { ReminderItem } from "@/store/reminders/types";

import {
  scheduleCustomReminder,
  cancelNotificationIds,
} from "@budget/notifications";
import type { NotificationPayload } from "@budget/notifications";

/* ------------------------- helpers ------------------------- */

function simpleHash(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return String(h);
}

function buildPayload(rem: ReminderItem): NotificationPayload {
  const t = rem.target as any;

  if (t?.type === "book") {
    return {
      v: 1,
      link: { kind: "normal", bookUri: t.bookUri, bookName: t.bookName },
    };
  }

  if (t?.type === "plan") {
    if (!t.planId) return { v: 1, kind: "generic" };
    // ✅ only planId; book selection will happen on click
    return { v: 1, link: { kind: "plan", planId: String(t.planId) } };
  }

  if (t?.type === "target") {
    if (!t.targetId) return { v: 1, kind: "generic" };
    return { v: 1, link: { kind: "target", targetId: String(t.targetId) } };
  }

  return { v: 1, kind: "generic" };
}

function computeScheduleHash(rem: ReminderItem) {
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
  if (!rem.enabled) {
    if (rem.notificationIds?.length) {
      await cancelNotificationIds(rem.notificationIds);
    }
    return { ids: [] as string[], hash: undefined as string | undefined };
  }

  if (rem.schedule.type === "once") {
    const ts = rem.schedule.timestamp;
    if (!Number.isFinite(ts) || ts <= Date.now()) {
      if (rem.notificationIds?.length) {
        await cancelNotificationIds(rem.notificationIds);
      }
      return { ids: [] as string[], hash: undefined as string | undefined };
    }
  }

  const nextHash = computeScheduleHash(rem);

  if (rem.scheduledHash === nextHash && rem.notificationIds?.length) {
    return { ids: rem.notificationIds, hash: rem.scheduledHash };
  }

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
  } as any);

  return { ids: [id], hash: nextHash };
}

/* ------------------------- component ------------------------- */

export function SchedulersHost() {
  const reminders = useRemindersStore((s) => s.reminders);
  const setNotificationIds = useRemindersStore((s) => s.setNotificationIds);
  const clearNotificationIds = useRemindersStore((s) => s.clearNotificationIds);
  const setScheduledHash = useRemindersStore((s) => s.setScheduledHash);

  const schedulingInputsKey = useMemo(() => {
    const compact = reminders.map((r) => ({
      id: r.id,
      enabled: r.enabled,
      title: r.title,
      body: r.body,
      schedule: r.schedule,
      target: r.target,
      owner: r.owner,
      scheduledHash: r.scheduledHash,
      notificationIds: r.notificationIds,
    }));
    return simpleHash(JSON.stringify(compact));
  }, [reminders]);

  const runningRef = useRef(false);
  const pendingRef = useRef(false);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!alive) return;

      if (runningRef.current) {
        pendingRef.current = true;
        return;
      }

      runningRef.current = true;
      pendingRef.current = false;

      try {
        await new Promise((r) => setTimeout(r, 0));

        for (const r of reminders) {
          if (!alive) return;

          const nextHash = computeScheduleHash(r);
          const alreadyOk =
            r.enabled &&
            r.scheduledHash === nextHash &&
            (r.notificationIds?.length ?? 0) > 0;

          if (alreadyOk) continue;

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
          } catch (e) {
            console.error("[SchedulersHost] scheduling failed:", r.id, e);
          }
        }
      } finally {
        runningRef.current = false;

        if (pendingRef.current && alive) {
          pendingRef.current = false;
          run();
        }
      }
    };

    run();

    return () => {
      alive = false;
    };
  }, [
    schedulingInputsKey,
    reminders,
    setNotificationIds,
    clearNotificationIds,
    setScheduledHash,
  ]);

  return null;
}
