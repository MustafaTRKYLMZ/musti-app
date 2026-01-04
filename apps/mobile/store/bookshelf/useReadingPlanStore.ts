import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AddPagesFromSessionInput,
  PlanBookProgress,
  PlanItemConfig,
  ReadingPlan,
} from "/core";
import { useReadingGamificationStore } from "./readingGamification/useReadingGamificationStore";


type ReadingPlanState = {
  plans: ReadingPlan[];

  // CRUD
  createPlan: (input: { name: string; items: PlanItemConfig[] }) => string; // returns planId
  deletePlan: (planId: string) => void;

  // daily reset
  ensureTodayPlan: (todayKey: string) => void;

  // progress
  addPagesFromSession: (input: AddPagesFromSessionInput) => void;

  // rename pdf across ALL plans (critical for multi-plan)
  renameBookInPlan: (oldUri: string, newUri: string, newName?: string) => void;

  updatePlan: (input: { planId: string; name: string; items: PlanItemConfig[] }) => void;
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayKeyISO() {
  return new Date().toISOString().slice(0, 10);
}

export const useReadingPlanStore = create<ReadingPlanState>()(
  persist(
    (set, get) => ({
      plans: [],

      createPlan: ({ name, items }) => {
        const dayKey = todayKeyISO();
        const id = makeId();

        const perBook: Record<string, PlanBookProgress> = {};
        for (const it of items) {
          perBook[it.bookUri] = {
            bookUri: it.bookUri,
            currentPageInBook: 1,
            pagesReadToday: 0,
            bookTotalPages: undefined,
          };
        }

        const plan: ReadingPlan = {
          id,
          name: name?.trim() || "Reading plan",
          items,
          perBook,
          dayKey,
          totalReadToday: 0,
          currentIndex: 0,
          currentPageInItem: 0,
          isCompleted: false,
          updatedAt: "",
          createdAt: "",
        };

        set((state) => ({
          plans: [plan, ...(state.plans ?? [])], // newest first
        }));

        return id;
      },

      deletePlan: (planId) =>
        set((state) => ({
          plans: (state.plans ?? []).filter((p) => p.id !== planId),
        })),

      // resets ONLY "today read" fields for every plan when day changes
      ensureTodayPlan: (todayKey) => {
        const state = get();
        const plans = state.plans ?? [];
        if (!plans.length) return;

        const nextPlans = plans.map((plan) => {
          if (plan.dayKey === todayKey) return plan;

          const newPerBook: Record<string, PlanBookProgress> = {};
          Object.values(plan.perBook ?? {}).forEach((pb) => {
            newPerBook[pb.bookUri] = {
              ...pb,
              pagesReadToday: 0,
            };
          });

          return {
            ...plan,
            perBook: newPerBook,
            dayKey: todayKey,
            totalReadToday: 0,
          };
        });

        set({ plans: nextPlans });
      },

      addPagesFromSession: ({ planId, bookUri, pages, bookTotalPages }) => {
        const state = get();
        const plans = state.plans ?? [];
        if (!pages || pages <= 0) return;

        const planIndex = plans.findIndex((p) => p.id === planId);
        if (planIndex === -1) return;

        const plan = plans[planIndex];
        const items = plan.items ?? [];
        const startIndex = items.findIndex((it) => it.bookUri === bookUri);
        if (startIndex === -1) return;

        const perBook: Record<string, PlanBookProgress> = {
          ...(plan.perBook ?? {}),
        };

        // ✅ before remaining today (across ALL items)
        const prevRemainingTotal = (items ?? []).reduce((sum, it) => {
          const pb = perBook[it.bookUri];
          const already = pb?.pagesReadToday ?? 0;
          const target = it.pagesPerDay ?? 0;
          return sum + Math.max(0, target - already);
        }, 0);

        let remainingPages = pages;
        let totalReadToday = plan.totalReadToday || 0;
        let idx = startIndex;

        while (remainingPages > 0 && idx < items.length) {
          const item = items[idx];

          if (!perBook[item.bookUri]) {
            perBook[item.bookUri] = {
              bookUri: item.bookUri,
              currentPageInBook: 1,
              pagesReadToday: 0,
              bookTotalPages: undefined,
            };
          }

          const prev = perBook[item.bookUri];
          const alreadyRead = prev.pagesReadToday || 0;
          const target = item.pagesPerDay || 0;
          const remainingForToday = Math.max(0, target - alreadyRead);

          if (remainingForToday <= 0) {
            idx++;
            continue;
          }

          const usePages = Math.min(remainingPages, remainingForToday);

          const effectiveTotalPages =
            bookTotalPages && bookTotalPages > 0
              ? bookTotalPages
              : prev.bookTotalPages;

          let newCurrentPage = (prev.currentPageInBook || 1) + usePages;

          if (effectiveTotalPages && effectiveTotalPages > 0) {
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

          if (alreadyRead + usePages >= target) {
            idx++;
          }
        }

        const nextPlans = [...plans];
        nextPlans[planIndex] = {
          ...plan,
          perBook,
          totalReadToday,
        };

        set({ plans: nextPlans });

        // ✅ after remaining today
        const nextRemainingTotal = (items ?? []).reduce((sum, it) => {
          const pb = perBook[it.bookUri];
          const already = pb?.pagesReadToday ?? 0;
          const target = it.pagesPerDay ?? 0;
          return sum + Math.max(0, target - already);
        }, 0);

        // ✅ award: when we cross to 0 remaining today
        if (prevRemainingTotal > 0 && nextRemainingTotal === 0) {
          useReadingGamificationStore.getState().onPlanCompleted({
            at: Date.now(),
            bookUri, // session book; good enough anchor
          });
        }
      },

      // ✅ rename across ALL plans
      renameBookInPlan: (oldUri, newUri, newName) =>
        set((state) => {
          const plans = state.plans ?? [];
          if (!plans.length) return {};

          const nextPlans = plans.map((plan) => {
            const items = (plan.items ?? []).map((item) =>
              item.bookUri === oldUri
                ? {
                    ...item,
                    bookUri: newUri,
                    bookName: newName ?? item.bookName,
                  }
                : item
            );

            const perBook: Record<string, PlanBookProgress> = {};
            Object.entries(plan.perBook ?? {}).forEach(([uri, progress]) => {
              if (uri === oldUri) {
                perBook[newUri] = { ...progress, bookUri: newUri };
              } else {
                perBook[uri] = progress;
              }
            });

            return { ...plan, items, perBook };
          });

          return { plans: nextPlans };
        }),

      updatePlan: ({ planId, name, items }) =>
        set((state) => {
          const plans = state.plans ?? [];
          const idx = plans.findIndex((p) => p.id === planId);
          if (idx === -1) return {};

          const plan = plans[idx];

          // ✅ perBook: keep existing, init new, drop removed
          const nextPerBook: Record<string, PlanBookProgress> = {};

          for (const it of items) {
            const prev = plan.perBook?.[it.bookUri];

            nextPerBook[it.bookUri] =
              prev ??
              ({
                bookUri: it.bookUri,
                currentPageInBook: 1,
                pagesReadToday: 0,
                bookTotalPages: undefined,
              } as PlanBookProgress);
          }

          // ✅ totalReadToday: sum of remaining books
          const nextTotalReadToday = Object.values(nextPerBook).reduce(
            (sum, pb) => sum + (pb.pagesReadToday || 0),
            0
          );

          const nextPlan = {
            ...plan,
            name: name?.trim() || plan.name,
            items,
            perBook: nextPerBook,
            totalReadToday: nextTotalReadToday,
          };

          const nextPlans = [...plans];
          nextPlans[idx] = nextPlan;

          return { plans: nextPlans };
        }),
    }),
    {
      name: "reading-plan-v2",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
