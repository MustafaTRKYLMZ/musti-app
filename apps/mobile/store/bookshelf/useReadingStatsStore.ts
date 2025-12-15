import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { DailyReadingStat } from "@budget/core";

interface ReadingStatsState {
  stats: Record<string, DailyReadingStat>;
  addPages: (input: {
    bookUri: string;
    date: string; // YYYY-MM-DD
    pages: number;
    targetPages?: number;
  }) => void;
  setTarget: (input: {
    bookUri: string;
    date: string;
    targetPages: number;
  }) => void;
  reset: () => void;
}

export const useReadingStatsStore = create<ReadingStatsState>()(
  persist(
    (set, get) => ({
      stats: {},

      addPages: ({ bookUri, date, pages, targetPages }) => {
        if (pages <= 0) return;

        const key = `${bookUri}:${date}`;
        const current = get().stats[key];

        const next: DailyReadingStat = {
          id: key,
          bookUri,
          date,
          pagesRead: (current?.pagesRead ?? 0) + pages,
          targetPages:
            targetPages !== undefined
              ? targetPages
              : current?.targetPages,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          stats: {
            ...state.stats,
            [key]: next,
          },
        }));
      },

      setTarget: ({ bookUri, date, targetPages }) => {
        const key = `${bookUri}:${date}`;
        const current = get().stats[key];

        const next: DailyReadingStat = {
          id: key,
          bookUri,
          date,
          pagesRead: current?.pagesRead ?? 0,
          targetPages,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          stats: {
            ...state.stats,
            [key]: next,
          },
        }));
      },

      reset: () => set({ stats: {} }),
    }),
    {
      name: "reading-stats",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
