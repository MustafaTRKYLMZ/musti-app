import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type BookshelfTabKey = "plans" | "targets";

type State = {
  selected: BookshelfTabKey;
  setSelected: (t: BookshelfTabKey) => void;
};

export const useBookshelfTabsStore = create<State>()(
  persist(
    (set) => ({
      selected: "plans",
      setSelected: (t) => set({ selected: t }),
    }),
    {
      name: "bookshelf.tabs.v1",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
