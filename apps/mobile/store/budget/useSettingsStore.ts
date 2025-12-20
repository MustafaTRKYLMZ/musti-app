// apps/mobile/store/useSettingsStore.ts

import { getZustandStorage } from "@/utils/storage/zustandStorage";
import { normalizeDate } from "@budget/core";

interface InitialBalance {
  amount: number;
  date: string;
  updatedAt: string;
}
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SettingsStore {
  initialBalance: InitialBalance | null;
  isLoading: boolean;
  isHydrated: boolean;

  // called by screens (e.g. SettingsScreen useEffect)
  loadInitialBalance: () => Promise<void>;
  saveInitialBalance: (payload: {
    amount: number;
    date: string;
  }) => Promise<boolean>;
}

const STORAGE_KEY = "settings_v1";

export const useSettingsStore = create(
  persist<SettingsStore>(
    (set, get) => ({
      initialBalance: null,
      isLoading: false,
      isHydrated: false,

      async loadInitialBalance() {
        const { isHydrated } = get();
        if (!isHydrated) {
          set({ isLoading: true });
          
          set({ isLoading: false, isHydrated: true });
          return;
        }
        set({ isLoading: false });
      },

      async saveInitialBalance(payload) {
        try {
          set({ isLoading: true });

          const now = new Date().toISOString();
          const normalizedDate = normalizeDate(payload.date);

          const next: InitialBalance = {
            amount: payload.amount,
            date: normalizedDate,
            updatedAt: now,
          };

          set({ initialBalance: next, isLoading: false });

          return true;
        } catch (e) {
          console.log("[useSettingsStore] saveInitialBalance error:", e);
          set({ isLoading: false });
          return false;
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => getZustandStorage()),
      onRehydrateStorage: () => (state) => {
       
        if (state) {
          state.isHydrated = true;
          state.isLoading = false;
        }
      },
    }
  )
);
