// apps/mobile/store/useReadingPlanStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { nanoid } from "nanoid/non-secure";

export type ReadingPlanItem = {
  id: string;
  bookUri: string;
  bookName: string;
  pagesPerDay: number;
};

export type ActiveReadingPlan = {
  id: string;
  name: string;
  items: ReadingPlanItem[];

  // günlük progress
  currentIndex: number; // bugün hangi item'dayız
  currentPageInItem: number; // bugünkü bu item'da kaç sayfa okundu
  isCompletedForToday: boolean;
  lastRunDate: string | null; // "YYYY-MM-DD"
};

interface ReadingPlanState {
  activePlan: ActiveReadingPlan | null;

  // plan kurma / düzenleme
  setActivePlan: (input: {
    name: string;
    items: { bookUri: string; bookName: string; pagesPerDay: number }[];
  }) => void;
  clearActivePlan: () => void;
  updatePlanName: (name: string) => void;
  updatePlanItems: (items: ReadingPlanItem[]) => void;

  // günlük reset
  ensureTodayPlan: (today: string) => void;

  // okuma sırasında plan ilerletme
  advanceForBook: (input: { bookUri: string; pagesRead: number }) => void;
}

export const useReadingPlanStore = create<ReadingPlanState>()(
  persist(
    (set, get) => ({
      activePlan: null,

      setActivePlan: ({ name, items }) => {
        const withIds: ReadingPlanItem[] = items.map((it) => ({
          id: nanoid(),
          bookUri: it.bookUri,
          bookName: it.bookName,
          pagesPerDay: it.pagesPerDay,
        }));

        set({
          activePlan: {
            id: nanoid(),
            name,
            items: withIds,
            currentIndex: 0,
            currentPageInItem: 0,
            isCompletedForToday: false,
            lastRunDate: null,
          },
        });
      },

      clearActivePlan: () => {
        set({ activePlan: null });
      },

      updatePlanName: (name) =>
        set((state) => {
          if (!state.activePlan) return state;
          return {
            ...state,
            activePlan: {
              ...state.activePlan,
              name,
            },
          };
        }),

      updatePlanItems: (items) =>
        set((state) => {
          if (!state.activePlan) return state;
          return {
            ...state,
            activePlan: {
              ...state.activePlan,
              items,
            },
          };
        }),

      ensureTodayPlan: (today: string) =>
        set((state) => {
          const plan = state.activePlan;
          if (!plan) return state;

          if (plan.lastRunDate === today) {
            return state;
          }

          return {
            ...state,
            activePlan: {
              ...plan,
              currentIndex: 0,
              currentPageInItem: 0,
              isCompletedForToday: false,
              lastRunDate: today,
            },
          };
        }),

      advanceForBook: ({ bookUri, pagesRead }) =>
        set((state) => {
          const plan = state.activePlan;
          if (!plan || plan.items.length === 0 || pagesRead <= 0) {
            return state;
          }

          const today = dayjs().format("YYYY-MM-DD");

          let currentIndex = plan.currentIndex;
          let currentPageInItem = plan.currentPageInItem;
          let isCompletedForToday = plan.isCompletedForToday;
          let lastRunDate = plan.lastRunDate;

          // yeni gün ise günlük progress'i resetle
          if (lastRunDate !== today) {
            currentIndex = 0;
            currentPageInItem = 0;
            isCompletedForToday = false;
            lastRunDate = today;
          }

          let remaining = pagesRead;

          while (
            remaining > 0 &&
            !isCompletedForToday &&
            currentIndex < plan.items.length
          ) {
            const item = plan.items[currentIndex];

            // plan sırası dışına çıkmayalım: sadece o anki item'in kitabından gelen okuma sayılır
            if (item.bookUri !== bookUri) {
              break;
            }

            const remainingInItem = item.pagesPerDay - currentPageInItem;

            if (remaining <= remainingInItem) {
              currentPageInItem += remaining;
              remaining = 0;
            } else {
              remaining -= remainingInItem;
              currentIndex += 1;
              currentPageInItem = 0;

              if (currentIndex >= plan.items.length) {
                isCompletedForToday = true;
                currentIndex = plan.items.length - 1;
                currentPageInItem =
                  plan.items[currentIndex]?.pagesPerDay ?? 0;
                break;
              }
            }
          }

          return {
            ...state,
            activePlan: {
              ...plan,
              currentIndex,
              currentPageInItem,
              isCompletedForToday,
              lastRunDate,
            },
          };
        }),
    }),
    {
      name: "reading-plan",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
