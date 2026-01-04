import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import type { DailyTotals, GamificationState, XPState, LastGain } from "./types";
import { xpForNextLevel } from "@/constants/xp";
import { ReadingMode } from "@musti/core";
import { useGamificationSettingsStore } from "./useGamificationSettingsStore";
import { clampInt } from "@/utils/number";

const STORAGE_KEY = "reading_gamification_v1";

const toDayKeyLocal = (ts: number) => {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};


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
  const d1 = dayjs(dayKey).startOf("day");
  const d0 = dayjs(prevDayKey).startOf("day");
  if (!d1.isValid() || !d0.isValid()) return false;
  const diffDays = d1.diff(d0, "day");
  return diffDays === 1;
};

type PersistShape = {
  daily?: Record<string, DailyTotals>;
  streak?: GamificationState["streak"];
  xp?: { totalXp?: number };
  lastGain?: LastGain | null;
};

export const useReadingGamificationStore = create<GamificationState>((set, get) => ({
  hydrated: false,
  daily: {},
  lastGain: null,

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

      const parsed = JSON.parse(raw) as PersistShape;

      set((s) => ({
        ...s,
        hydrated: true,
        daily: parsed.daily ?? {},
        streak: parsed.streak ?? s.streak,
        xp: parsed.xp ? recomputeXp(parsed.xp.totalXp ?? 0) : s.xp,
        lastGain: parsed.lastGain ?? null,
      }));
    } catch (error) {
      console.error(
        "Failed to hydrate reading gamification from AsyncStorage, falling back to defaults.",
        error
      );
      set({ hydrated: true });
    }
  },

  resetAll: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({
      hydrated: true,
      daily: {},
      lastGain: null,
      streak: { current: 0, best: 0, lastQualifiedDate: null, freezeTokens: 1 },
      xp: recomputeXp(0),
    });
  },

  clearLastGain: () => set({ lastGain: null }),

  logReadingProgress: (args) => {
    const { at, minutesDelta } = args;

    const mode: ReadingMode = normalizeMode((args as any).mode);

    const pagesDelta =
      typeof args.pagesDelta === "number"
        ? Math.max(0, clampInt(args.pagesDelta))
        : typeof args.fromPage === "number" && typeof args.toPage === "number"
          ? Math.max(0, clampInt(args.toPage - args.fromPage))
          : 0;

    const minutes = Math.max(0, clampInt(minutesDelta ?? 0));
    const dayKey = toDayKeyLocal(at);

    const settings = useGamificationSettingsStore.getState().settings;

    const qualifyPages = Math.max(1, clampInt(settings.qualifyPagesPerDay));
    const xpPerPage = Math.max(0, clampInt(settings.xpPerPage));

    const multiplier =
      mode === "target"
        ? Number(settings.targetMultiplier ?? 1.2)
        : mode === "plan"
          ? Number(settings.planMultiplier ?? 1.1)
          : 1.0;

    const gainedXp = Math.round(pagesDelta * xpPerPage * multiplier);

    set((state) => {
      const prevDay = state.daily[dayKey];

      const nextDaily: DailyTotals = {
        pages: ensureDaily(prevDay).pages + pagesDelta,
        minutes: ensureDaily(prevDay).minutes + minutes,
        sessions:
          ensureDaily(prevDay).sessions + (pagesDelta > 0 || minutes > 0 ? 1 : 0),
      };

      const daily = { ...state.daily, [dayKey]: nextDaily };
      const xp = recomputeXp(state.xp.totalXp + gainedXp);

      // streak
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

      const lastGain: LastGain | null =
        gainedXp > 0
          ? { at, dayKey, xp: gainedXp, pages: pagesDelta, mode }
          : state.lastGain;

      const toSave: PersistShape = {
        daily,
        streak,
        xp: { totalXp: xp.totalXp },
        lastGain,
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch((error) => {
        console.error("Failed to persist reading gamification progress:", error);
      });

      return { daily, streak, xp, lastGain };
    });

    return gainedXp;
  },

  onTargetCompleted: ({ at, bookUri: _bookUri }) => {
    const settings = useGamificationSettingsStore.getState().settings;
    const bonus = Math.max(0, clampInt(settings.targetCompleteBonus ?? 250));
    if (bonus <= 0) return 0;

    const dayKey = toDayKeyLocal(at);

    set((state) => {
      const xp = recomputeXp(state.xp.totalXp + bonus);

      const lastGain: LastGain = {
        at,
        dayKey,
        xp: bonus,
        pages: 0,
        mode: "target",
      };

      return { xp, lastGain };
    });

    // Persist after state update completes
    const currentState = useReadingGamificationStore.getState();
    const toSave: PersistShape = {
      daily: currentState.daily,
      streak: currentState.streak,
      xp: { totalXp: currentState.xp.totalXp },
      lastGain: currentState.lastGain,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch((error) => {
      console.error("Failed to persist target completion bonus:", error);
    });

    return bonus;
  },

  onPlanCompleted: ({ at, bookUri: _bookUri }) => {
    const settings = useGamificationSettingsStore.getState().settings;
    const bonus = Math.max(0, clampInt(settings.planCompleteBonus ?? 150));
    if (bonus <= 0) return 0;

    const dayKey = toDayKeyLocal(at);

    set((state) => {
      const xp = recomputeXp(state.xp.totalXp + bonus);

      const lastGain: LastGain = {
        at,
        dayKey,
        xp: bonus,
        pages: 0,
        mode: "plan",
      };

      return { xp, lastGain };
    });

    // Persist after state update completes
    const currentState = useReadingGamificationStore.getState();
    const toSave: PersistShape = {
      daily: currentState.daily,
      streak: currentState.streak,
      xp: { totalXp: currentState.xp.totalXp },
      lastGain: currentState.lastGain,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch((error) => {
      console.error("Failed to persist plan completion bonus:", error);
    });

    return bonus;
  },
}));
