import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type BookshelfNotificationSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
  setEnabled: (v: boolean) => void;
  setTime: (hour: number, minute: number) => void;
};

export const useBookshelfNotificationSettingsStore =
  create<BookshelfNotificationSettings>()(
    persist(
      (set) => ({
        enabled: false,
        hour: 20,
        minute: 30,
        setEnabled: (enabled) => set({ enabled }),
        setTime: (hour, minute) => set({ hour, minute }),
      }),
      {
        name: "bookshelf-notification-settings",
        storage: createJSONStorage(() => AsyncStorage),
      }
    )
  );
