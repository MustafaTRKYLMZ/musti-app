// apps/mobile/store/useReadingPlanStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type PlanItemConfig = {
  bookUri: string;
  bookName: string;
  pagesPerDay: number; // daily target for this book
};

export type PlanBookProgress = {
  bookUri: string;
  currentPageInBook: number; // cursor within the plan (book progress)
  pagesReadToday: number; // pages read TODAY from this book for this plan
  bookTotalPages?: number; // total page count of that book (for the plan)
};

export type ActiveReadingPlan = {
  name: string;
  items: PlanItemConfig[];
  perBook: Record<string, PlanBookProgress>;
  dayKey: string; // "YYYY-MM-DD"
  totalReadToday: number;
};

type AddPagesFromSessionInput = {
  bookUri: string;
  pages: number;
  bookTotalPages?: number; // optional, comes from viewer
};

type ReadingPlanState = {
  activePlan: ActiveReadingPlan | null;
  setActivePlan: (input: { name: string; items: PlanItemConfig[] }) => void;
  clearActivePlan: () => void;
  ensureTodayPlan: (todayKey: string) => void;
  addPagesFromSession: (input: AddPagesFromSessionInput) => void;
  renameBookInPlan: (oldUri: string, newUri: string, newName?: string) => void;
};

export const useReadingPlanStore = create<ReadingPlanState>()(
  persist(
    (set, get) => ({
      activePlan: null,

      // Create plan from modal
      setActivePlan: ({ name, items }) => {
        const today = new Date().toISOString().slice(0, 10);

        const perBook: Record<string, PlanBookProgress> = {};
        items.forEach((it) => {
          perBook[it.bookUri] = {
            bookUri: it.bookUri,
            currentPageInBook: 1,
            pagesReadToday: 0,
            bookTotalPages: undefined,
          };
        });

        set({
          activePlan: {
            name,
            items,
            perBook,
            dayKey: today,
            totalReadToday: 0,
          },
        });
      },

      clearActivePlan: () => set({ activePlan: null }),

      // When the day changes, only reset "pages read today"
      // Do NOT touch the plan cursor (currentPageInBook) or bookTotalPages.
      ensureTodayPlan: (todayKey) => {
        const state = get();
        const plan = state.activePlan;
        if (!plan) return;
        if (plan.dayKey === todayKey) return;

        const newPerBook: Record<string, PlanBookProgress> = {};
        Object.values(plan.perBook).forEach((pb) => {
          newPerBook[pb.bookUri] = {
            ...pb,
            pagesReadToday: 0,
          };
        });

        set({
          activePlan: {
            ...plan,
            perBook: newPerBook,
            dayKey: todayKey,
            totalReadToday: 0,
          },
        });
      },

      // In one session X pages were read → distribute this into the plan
      // 1) Start with the book where the session was opened
      // 2) If the daily target for that book is filled, move to the next book
      // 3) If there are still pages left after the last book, that part is "outside the plan" (for now)
      addPagesFromSession: ({ bookUri, pages, bookTotalPages }) => {
        const state = get();
        const plan = state.activePlan;
        if (!plan) return;
        if (!pages || pages <= 0) return;

        const items = plan.items;
        const startIndex = items.findIndex((it) => it.bookUri === bookUri);
        if (startIndex === -1) return;

        const perBook: Record<string, PlanBookProgress> = { ...plan.perBook };

        let remainingPages = pages;
        let totalReadToday = plan.totalReadToday;
        let idx = startIndex;

        while (remainingPages > 0 && idx < items.length) {
          const item = items[idx];

          // if perBook record does not exist, initialize it
          if (!perBook[item.bookUri]) {
            perBook[item.bookUri] = {
              bookUri: item.bookUri,
              currentPageInBook: 1,
              pagesReadToday: 0,
              bookTotalPages: undefined,
            };
          }

          const prev = perBook[item.bookUri];

          const alreadyRead = prev.pagesReadToday;
          const target = item.pagesPerDay;
          const remainingForToday = Math.max(0, target - alreadyRead);

          if (remainingForToday <= 0) {
            // today's target for this book is already filled → move to the next book
            idx++;
            continue;
          }

          const usePages = Math.min(remainingPages, remainingForToday);

          // update total page count if provided
          const effectiveTotalPages =
            bookTotalPages && bookTotalPages > 0
              ? bookTotalPages
              : prev.bookTotalPages;

          // update currentPageInBook + wrap if necessary
          let newCurrentPage = prev.currentPageInBook + usePages;

          if (effectiveTotalPages && effectiveTotalPages > 0) {
            // Wrap around using 1-based page numbers: convert to 0-based, mod by total, convert back to 1-based
            const zeroBased = (newCurrentPage - 1) % effectiveTotalPages;
            newCurrentPage = zeroBased + 1;
          }

          perBook[item.bookUri] = {
            ...prev,
            pagesReadToday: alreadyRead + usePages,
            currentPageInBook: newCurrentPage,
            bookTotalPages: effectiveTotalPages,
          };

          totalReadToday += usePages;
          remainingPages -= usePages;

          // daily target for this book is done, move to the next one
          if (alreadyRead + usePages >= target) {
            idx++;
          }
        }

        set({
          activePlan: {
            ...plan,
            perBook,
            totalReadToday,
          },
        });
      },

      renameBookInPlan: (oldUri, newUri, newName) =>
        set((state) => {
          const plan = state.activePlan;
          if (!plan) return {}; 

          const items = plan.items.map((item) =>
            item.bookUri === oldUri
              ? {
                  ...item,
                  bookUri: newUri,
                  bookName: newName ?? item.bookName,
                }
              : item
          );

          const perBook: Record<string, PlanBookProgress> = {};
          Object.entries(plan.perBook).forEach(([bookUri, progress]) => {
            if (bookUri === oldUri) {
              perBook[newUri] = {
                ...progress,
                bookUri: newUri,
              };
            } else {
              perBook[bookUri] = progress;
            }
          });

          return {
            activePlan: {
              ...plan,
              items,
              perBook,
            },
          };
        }),
    }),
    {
      name: "reading-plan-v1",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
