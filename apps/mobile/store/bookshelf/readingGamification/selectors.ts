import { useReadingGamificationStore } from "./useReadingGamificationStore";

export const useStreak = () =>
  useReadingGamificationStore((s) => s.streak);

export const useXp = () =>
  useReadingGamificationStore((s) => s.xp);

export const useTodayTotals = (todayKey: string) =>
  useReadingGamificationStore((s) => s.daily[todayKey] ?? { pages: 0, minutes: 0, sessions: 0 });
