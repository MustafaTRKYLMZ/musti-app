import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type BudgetNotificationSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
  setEnabled: (v: boolean) => void;
  setTime: (hour: number, minute: number) => void;
};

export const useBudgetNotificationSettingsStore =
  create<BudgetNotificationSettings>()(
    persist(
      (set) => ({
        enabled: false,
        hour: 9,
        minute: 0,
        setEnabled: (enabled) => set({ enabled }),
        setTime: (hour, minute) => set({ hour, minute }),
      }),
      {
        name: "budget-notification-settings",
        storage: createJSONStorage(() => AsyncStorage),
      }
    )
  );
