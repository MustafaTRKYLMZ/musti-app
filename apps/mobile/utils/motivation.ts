import dayjs from "dayjs";
import { useReadingGamificationStore } from "@/store/bookshelf/readingGamification/useReadingGamificationStore";
import { useGamificationSettingsStore } from "@/store/bookshelf/readingGamification/useGamificationSettingsStore";
import { scheduleCustomReminder } from "@budget/notifications";
// ↑ scheduleCustomReminder senin paylaştığın fonksiyon

const MOTIVATION_ID = "motivation-nudge-v1";

// TODO: Implement proper cancellation logic
// This function should track and cancel scheduled notification IDs
// Currently a no-op - needs implementation to prevent old notifications
// from remaining scheduled when settings change
export async function cancelMotivationNudge() {
  // Future implementation should:
  // 1. Track the expo notification ID returned by scheduleCustomReminder
  // 2. Call cancelNotificationIds([expoId]) to cancel the scheduled notification
}

export async function scheduleMotivationNudgeIfNeeded() {
  const g = useReadingGamificationStore.getState();
  const sStore = useGamificationSettingsStore.getState();

  if (!g.hydrated || !sStore.hydrated) return;

  const s = sStore.settings;

  // ✅ kapalıysa: iptal + çık
  if (!s.motivationEnabled) {
    await cancelMotivationNudge().catch((error) => {
      console.error("Failed to cancel motivation nudge:", error);
    });
    return;
  }

  const todayKey = dayjs().format("YYYY-MM-DD");
  const today = g.daily?.[todayKey] ?? { pages: 0, minutes: 0, sessions: 0 };

  const goal = Math.max(1, Number(s.qualifyPagesPerDay ?? 10));
  const remaining = Math.max(0, goal - (today.pages ?? 0));

  // ✅ onlyIfNotDone açıksa ve hedef tamamlandıysa iptal
  if (s.motivationOnlyIfNotDone && remaining <= 0) {
    await cancelMotivationNudge().catch((error) => {
      console.error("Failed to cancel motivation nudge:", error);
    });
    return;
  }

  // ✅ mesaj seçimi
  const title = "Reading time 📖";
  const body =
    remaining <= 0
      ? "Nice — your streak goal is already secured ✅"
      : remaining <= 5
        ? `Only ${remaining} page${remaining === 1 ? "" : "s"} left to secure your streak ✅`
        : `You have ${remaining} pages left for today’s streak. 10 minutes is enough.`;

  // ✅ schedule
  const hour = Math.max(0, Math.min(23, Number(s.motivationHour ?? 20)));
  const minute = Math.max(0, Math.min(59, Number(s.motivationMinute ?? 30)));

  const schedule =
    s.motivationScheduleType === "weekly"
      ? { type: "weekly" as const, weekday: s.motivationWeekday ?? 1, hour, minute }
      : { type: "daily" as const, hour, minute };

  // ✅ tek notification kalsın (senin mevcut cancel stratejin neyse ona bağla)
  await cancelMotivationNudge().catch((error) => {
    console.error("Failed to cancel motivation nudge before scheduling:", error);
  });

  await scheduleCustomReminder({
    id: MOTIVATION_ID,
    owner: "bookshelf",
    title,
    body,
    schedule,
    payload: { v: 1, kind: "motivation" },
  });
}
