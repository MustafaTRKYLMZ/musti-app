import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DailyTotals, GamificationState, XPState } from "./types";
import { xpForNextLevel } from "@/constants/xp";
import { ReadingMode } from "@budget/core";

import { useGamificationSettingsStore } from "./useGamificationSettingsStore";

const STORAGE_KEY = "reading_gamification_v1";

const toDayKeyLocal = (ts: number) => {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const clampInt = (n: number) => (Number.isFinite(n) ? Math.floor(n) : 0);

const recomputeXp = (totalXp: number): XPState => {
  let level = 1;
  let remaining = Math.max(0, clampInt(totalXp));
  let need = xpForNextLevel(level);

  while (remaining >= need) {
    remaining -= need;
    level += 1;
    need = xpForNextLevel(level);
    if (level > 999) break;
  }

  return {
    totalXp: Math.max(0, clampInt(totalXp)),
    level,
    xpIntoLevel: remaining,
    xpForNextLevel: need,
  };
};

const normalizeMode = (m: any): ReadingMode => {
  if (m === "plan" || m === "target" || m === "normal") return m;
  return "normal";
};

const ensureDaily = (prev?: DailyTotals): DailyTotals =>
  prev ?? { pages: 0, minutes: 0, sessions: 0 };

const isYesterday = (dayKey: string, prevDayKey: string) => {
  const [y1, m1, d1] = dayKey.split("-").map((x) => parseInt(x, 10));
  const [y0, m0, d0] = prevDayKey.split("-").map((x) => parseInt(x, 10));
  if (!y1 || !m1 || !d1 || !y0 || !m0 || !d0) return false;
  const a = new Date(y1, m1 - 1, d1).getTime();
  const b = new Date(y0, m0 - 1, d0).getTime();
  const diffDays = Math.round((a - b) / (24 * 3600 * 1000));
  return diffDays === 1;
};

export const useReadingGamificationStore = create<GamificationState>((set, get) => ({
  hydrated: false,
  daily: {},

  streak: {
    current: 0,
    best: 0,
    lastQualifiedDate: null,
    freezeTokens: 1,
  },

  xp: recomputeXp(0),

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ hydrated: true });
        return;
      }
      const parsed = JSON.parse(raw) as Partial<GamificationState>;
      set((s) => ({
        ...s,
        hydrated: true,
        daily: parsed.daily ?? {},
        streak: parsed.streak ?? s.streak,
        xp: parsed.xp ? recomputeXp(parsed.xp.totalXp ?? 0) : s.xp,
      }));
    } catch {
      set({ hydrated: true });
    }
  },

  resetAll: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({
      hydrated: true,
      daily: {},
      streak: { current: 0, best: 0, lastQualifiedDate: null, freezeTokens: 1 },
      xp: recomputeXp(0),
    });
  },

  logReadingProgress: (args) => {
    const { at, minutesDelta } = args;

    const mode: ReadingMode = normalizeMode((args as any).mode);

    const pagesDelta =
      typeof args.pagesDelta === "number"
        ? args.pagesDelta
        : typeof args.fromPage === "number" && typeof args.toPage === "number"
          ? Math.max(0, clampInt(args.toPage - args.fromPage))
          : 0;

    const minutes = Math.max(0, clampInt(minutesDelta ?? 0));
    const dayKey = toDayKeyLocal(at);

    // ✅ SETTINGS: single source
    const settings = useGamificationSettingsStore.getState().settings;

    const qualifyPages = Math.max(1, clampInt(settings.qualifyPagesPerDay));
    const xpPerPage = Math.max(0, clampInt(settings.xpPerPage));

    const multiplier =
      mode === "target"
        ? Number(settings.targetMultiplier ?? 1.2)
        : mode === "plan"
          ? Number(settings.planMultiplier ?? 1.1)
          : 1.0;

    set((state) => {
      const prevDay = state.daily[dayKey];

      const nextDaily: DailyTotals = {
        pages: ensureDaily(prevDay).pages + pagesDelta,
        minutes: ensureDaily(prevDay).minutes + minutes,
        sessions:
          ensureDaily(prevDay).sessions + (pagesDelta > 0 || minutes > 0 ? 1 : 0),
      };

      const daily = { ...state.daily, [dayKey]: nextDaily };

      // XP
      const gainedXp = Math.round(pagesDelta * xpPerPage * multiplier);
      const xp = recomputeXp(state.xp.totalXp + gainedXp);

      // Streak update: only when crossing qualify threshold
      let streak = state.streak;
      const crossedToday =
        ensureDaily(prevDay).pages < qualifyPages && nextDaily.pages >= qualifyPages;

      if (crossedToday) {
        if (streak.lastQualifiedDate === dayKey) {
          // already counted
        } else if (streak.lastQualifiedDate == null) {
          streak = {
            ...streak,
            current: 1,
            best: Math.max(streak.best, 1),
            lastQualifiedDate: dayKey,
          };
        } else if (isYesterday(dayKey, streak.lastQualifiedDate)) {
          const cur = streak.current + 1;
          streak = {
            ...streak,
            current: cur,
            best: Math.max(streak.best, cur),
            lastQualifiedDate: dayKey,
          };
        } else {
          streak = {
            ...streak,
            current: 1,
            best: Math.max(streak.best, 1),
            lastQualifiedDate: dayKey,
          };
        }
      }

      queueMicrotask(() => {
        const toSave = { daily, streak, xp: { totalXp: xp.totalXp } };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
      });

      return { daily, streak, xp };
    });
  },

  onTargetCompleted: ({ at, bookUri }) => {
    const settings = useGamificationSettingsStore.getState().settings;
    const BONUS = Math.max(0, clampInt(settings.targetCompleteBonus ?? 250));
    if (BONUS <= 0) return;

    set((state) => {
      const xp = recomputeXp(state.xp.totalXp + BONUS);

      queueMicrotask(() => {
        // Eğer ileride "completion history" tutmak istersen burada ekleyebilirsin:
        // e.g. completions: [...state.completions, { type:"target", at, bookUri }]
        const toSave = {
          daily: state.daily,
          streak: state.streak,
          xp: { totalXp: xp.totalXp },
        };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
      });

      return { xp };
    });
  },

  onPlanCompleted: ({ at, bookUri }) => {
    const settings = useGamificationSettingsStore.getState().settings;
    const BONUS = Math.max(0, clampInt(settings.planCompleteBonus ?? 150));
    if (BONUS <= 0) return;

    set((state) => {
      const xp = recomputeXp(state.xp.totalXp + BONUS);

      queueMicrotask(() => {
        const toSave = {
          daily: state.daily,
          streak: state.streak,
          xp: { totalXp: xp.totalXp },
        };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
      });

      return { xp };
    });
  },
}));
