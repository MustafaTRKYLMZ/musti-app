import dayjs from "dayjs";
import Constants from "expo-constants";
import { useReadingGamificationStore } from "@/store/bookshelf/readingGamification/useReadingGamificationStore";
import { useGamificationSettingsStore } from "@/store/bookshelf/readingGamification/useGamificationSettingsStore";
import { scheduleCustomReminder } from "@musti/notifications";

const MOTIVATION_ID = "motivation-nudge-v1";

function notificationsSupported(): boolean {
  return Constants.appOwnership !== "expo";
}

async function getNotificationsModule() {
  if (!notificationsSupported()) return null;
  try {
    return await import("expo-notifications");
  } catch {
    return null;
  }
}

export async function cancelMotivationNudge() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = scheduled
      .filter((n) => n.content.data?.reminderId === MOTIVATION_ID)
      .map((n) => n.identifier);

    if (toCancel.length > 0) {
      await Promise.all(
        toCancel.map((id) =>
          Notifications.cancelScheduledNotificationAsync(id)
        )
      );
    }
  } catch (error) {
    console.warn("Failed to cancel motivation nudge:", error);
  }
}

export async function scheduleMotivationNudgeIfNeeded() {
  if (!notificationsSupported()) return;

  const g = useReadingGamificationStore.getState();
  const sStore = useGamificationSettingsStore.getState();

  if (!g.hydrated || !sStore.hydrated) return;

  const s = sStore.settings;

  if (!s.motivationEnabled) {
    await cancelMotivationNudge();
    return;
  }

  const todayKey = dayjs().format("YYYY-MM-DD");
  const today = g.daily?.[todayKey] ?? { pages: 0, minutes: 0, sessions: 0 };

  const goal = Math.max(1, Number(s.qualifyPagesPerDay ?? 10));
  const remaining = Math.max(0, goal - (today.pages ?? 0));

  if (s.motivationOnlyIfNotDone && remaining <= 0) {
    await cancelMotivationNudge();
    return;
  }

  const title = "Reading time 📖";
  const body =
    remaining <= 0
      ? "Nice — your streak goal is already secured ✅"
      : remaining <= 5
        ? `Only ${remaining} page${remaining === 1 ? "" : "s"} left to secure your streak ✅`
        : `You have ${remaining} pages left for today’s streak. 10 minutes is enough.`;

  const hour = Math.max(0, Math.min(23, Number(s.motivationHour ?? 20)));
  const minute = Math.max(0, Math.min(59, Number(s.motivationMinute ?? 30)));

  const schedule =
    s.motivationScheduleType === "weekly"
      ? {
          type: "weekly" as const,
          weekday: s.motivationWeekday ?? 1,
          hour,
          minute,
        }
      : { type: "daily" as const, hour, minute };

  await cancelMotivationNudge();

  try {
    await scheduleCustomReminder({
      id: MOTIVATION_ID,
      owner: "bookshelf",
      title,
      body,
      schedule,
      payload: { v: 1, kind: "motivation" },
    });
  } catch (error) {
    console.warn("Failed to schedule motivation nudge:", error);
  }
}
