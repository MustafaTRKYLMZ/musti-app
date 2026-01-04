import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { toNonNegativeInt } from "@/utils/toNonNegativeInt";
import { addDays } from "@/utils/addDays";
import { dateLTE } from "@/utils/dateLTE";
import { emptyByMode } from "@/utils/emptyByMode";
import { makeBookKey } from "@/utils/makeBookKey";
import { makeTargetKey } from "@/utils/makeTargetKey";
import { DailyReadingStat,LastEvent,AddPagesInput, ReadingMode} from "/core";
interface ReadingStatsState {
  byDate: Record<string, DailyReadingStat>;
  byBookDate: Record<string, DailyReadingStat>;
  byTargetDate: Record<string, DailyReadingStat>;
  lastEvent?: LastEvent;
  addPages: (input: AddPagesInput) => void;
  setLastEvent: (e: LastEvent | undefined) => void;
  getForDate: (date: string) => DailyReadingStat | undefined;
  getForBookDate: (bookUri: string, date: string) => DailyReadingStat | undefined;
  getForTargetDate: (targetId: string, date: string) => DailyReadingStat | undefined;

  getRange: (fromDate: string, toDate: string) => DailyReadingStat[]; // global, inclusive
  getBookRange: (bookUri: string, fromDate: string, toDate: string) => DailyReadingStat[]; // inclusive
  getTargetRange: (targetId: string, fromDate: string, toDate: string) => DailyReadingStat[]; // inclusive

  getStreak: (todayDate: string) => number; // global streak
  getWeekTotal: (todayDate: string) => number;
  getMonthTotal: (todayDate: string) => number;

  getBookWeekTotal: (bookUri: string, todayDate: string) => number;
  getBookMonthTotal: (bookUri: string, todayDate: string) => number;

  getTargetWeekTotal: (targetId: string, todayDate: string) => number;
  getTargetMonthTotal: (targetId: string, todayDate: string) => number;

  getBookAllTimeTotal: (bookUri: string) => number;
  getBookBestDay: (bookUri: string) => { date: string; pages: number } | undefined;
  getBookStreak: (bookUri: string, todayDate: string) => number;

  reset: () => void;
}
export const useReadingStatsStore = create<ReadingStatsState>()(
  persist(
    (set, get) => ({
      byDate: {},
      byBookDate: {},
      byTargetDate: {},
      lastEvent: undefined,

      addPages: ({ date, pages, mode, bookUri, targetId }) => {
        if (!date) return;
        if (!Number.isFinite(pages) || pages <= 0) return;

        const nowIso = new Date().toISOString();

        // 1) global byDate (always)
        const current = get().byDate[date];
        const nextGlobal: DailyReadingStat = current
          ? {
              ...current,
              pagesTotal: (current.pagesTotal ?? 0) + pages,
              pagesByMode: {
                ...(current.pagesByMode ?? emptyByMode()),
                [mode]: (current.pagesByMode?.[mode] ?? 0) + pages,
              },
              updatedAt: nowIso,
            }
          : {
              id: date,
              date,
              pagesTotal: pages,
              pagesByMode: { ...emptyByMode(), [mode]: pages } as Record<ReadingMode, number>,
              updatedAt: nowIso,
            };

        // 2) optional book-level
        let nextBook: DailyReadingStat | null = null;
        let bookKey: string | null = null;

        if (bookUri) {
          bookKey = makeBookKey(bookUri, date);
          const currentBook = get().byBookDate[bookKey];

          nextBook = currentBook
            ? {
                ...currentBook,
                pagesTotal: (currentBook.pagesTotal ?? 0) + pages,
                pagesByMode: {
                  ...(currentBook.pagesByMode ?? emptyByMode()),
                  [mode]: (currentBook.pagesByMode?.[mode] ?? 0) + pages,
                },
                updatedAt: nowIso,
              }
            : {
                id: bookKey,
                date,
                bookUri,
                pagesTotal: pages,
                pagesByMode: { ...emptyByMode(), [mode]: pages },
                updatedAt: nowIso,
              };
        }

        // 3) optional target-level
        let nextTarget: DailyReadingStat | null = null;
        let targetKey: string | null = null;

        if (targetId) {
          targetKey = makeTargetKey(targetId, date);
          const currentTarget = get().byTargetDate[targetKey];

          nextTarget = currentTarget
            ? {
                ...currentTarget,
                pagesTotal: (currentTarget.pagesTotal ?? 0) + pages,
                pagesByMode: {
                  ...(currentTarget.pagesByMode ?? emptyByMode() as Record<ReadingMode, number>),
                  [mode]: (currentTarget.pagesByMode?.[mode] ?? 0) + pages,
                },
                updatedAt: nowIso,
              }
            : {
                id: targetKey,
                date,
                targetId,
                pagesTotal: pages,
                pagesByMode: { ...emptyByMode(), [mode]: pages },
                updatedAt: nowIso,
              };
        }

        set((state) => ({
          byDate: {
            ...state.byDate,
            [date]: nextGlobal,
          },
          byBookDate:
            nextBook && bookKey
              ? {
                  ...state.byBookDate,
                  [bookKey]: nextBook,
                }
              : state.byBookDate,
          byTargetDate:
            nextTarget && targetKey
              ? {
                  ...state.byTargetDate,
                  [targetKey]: nextTarget,
                }
              : state.byTargetDate,
        }));
      },

      setLastEvent: (e) => set({ lastEvent: e }),

      getForDate: (date) => get().byDate[date],

      getForBookDate: (bookUri, date) => {
        if (!bookUri || !date) return undefined;
        return get().byBookDate[makeBookKey(bookUri, date)];
      },

      getForTargetDate: (targetId, date) => {
        if (!targetId || !date) return undefined;
        return get().byTargetDate[makeTargetKey(targetId, date)];
      },

      getRange: (fromDate, toDate) => {
        if (!fromDate || !toDate) return [];
        const res: DailyReadingStat[] = [];
        let d = fromDate;
        while (dateLTE(d, toDate)) {
          const s = get().byDate[d];
          if (s) res.push(s);
          d = addDays(d, 1);
        }
        return res;
      },

      getBookRange: (bookUri, fromDate, toDate) => {
        if (!bookUri || !fromDate || !toDate) return [];
        const res: DailyReadingStat[] = [];
        let d = fromDate;
        while (dateLTE(d, toDate)) {
          const s = get().byBookDate[makeBookKey(bookUri, d)];
          if (s) res.push(s);
          d = addDays(d, 1);
        }
        return res;
      },

      getTargetRange: (targetId, fromDate, toDate) => {
        if (!targetId || !fromDate || !toDate) return [];
        const res: DailyReadingStat[] = [];
        let d = fromDate;
        while (dateLTE(d, toDate)) {
          const s = get().byTargetDate[makeTargetKey(targetId, d)];
          if (s) res.push(s);
          d = addDays(d, 1);
        }
        return res;
      },

      getStreak: (todayDate) => {
        if (!todayDate) return 0;
        let streak = 0;
        let d = todayDate;
        while (true) {
          const s = get().byDate[d];
          if (!s || (s.pagesTotal ?? 0) <= 0) break;
          streak += 1;
          d = addDays(d, -1);
        }
        return streak;
      },

      getWeekTotal: (todayDate) => {
        if (!todayDate) return 0;
        let sum = 0;
        for (let i = 0; i < 7; i++) {
          const d = addDays(todayDate, -i);
          sum += get().byDate[d]?.pagesTotal ?? 0;
        }
        return sum;
      },

      getMonthTotal: (todayDate) => {
        if (!todayDate) return 0;
        let sum = 0;
        for (let i = 0; i < 30; i++) {
          const d = addDays(todayDate, -i);
          sum += get().byDate[d]?.pagesTotal ?? 0;
        }
        return sum;
      },

      getBookWeekTotal: (bookUri, todayDate) => {
        if (!bookUri || !todayDate) return 0;
        let sum = 0;
        for (let i = 0; i < 7; i++) {
          const d = addDays(todayDate, -i);
          sum += get().byBookDate[makeBookKey(bookUri, d)]?.pagesTotal ?? 0;
        }
        return sum;
      },

      getBookMonthTotal: (bookUri, todayDate) => {
        if (!bookUri || !todayDate) return 0;
        let sum = 0;
        for (let i = 0; i < 30; i++) {
          const d = addDays(todayDate, -i);
          sum += get().byBookDate[makeBookKey(bookUri, d)]?.pagesTotal ?? 0;
        }
        return sum;
      },

      getTargetWeekTotal: (targetId, todayDate) => {
        if (!targetId || !todayDate) return 0;
        let sum = 0;
        for (let i = 0; i < 7; i++) {
          const d = addDays(todayDate, -i);
          sum += get().byTargetDate[makeTargetKey(targetId, d)]?.pagesTotal ?? 0;
        }
        return sum;
      },

      getTargetMonthTotal: (targetId, todayDate) => {
        if (!targetId || !todayDate) return 0;
        let sum = 0;
        for (let i = 0; i < 30; i++) {
          const d = addDays(todayDate, -i);
          sum += get().byTargetDate[makeTargetKey(targetId, d)]?.pagesTotal ?? 0;
        }
        return sum;
      },

      // -------------------------
      // Book extras
      // -------------------------
      getBookAllTimeTotal: (bookUri) => {
        if (!bookUri) return 0;
        let sum = 0;
        for (const s of Object.values(get().byBookDate)) {
          if (!s?.bookUri) continue;
          if (s.bookUri !== bookUri) continue;
          sum += s.pagesTotal ?? 0;
        }
        return toNonNegativeInt(sum);
      },

      getBookBestDay: (bookUri) => {
        if (!bookUri) return undefined;

        let bestDate: string | undefined;
        let bestPages = 0;

        for (const s of Object.values(get().byBookDate)) {
          if (!s?.bookUri) continue;
          if (s.bookUri !== bookUri) continue;

          const pages = toNonNegativeInt(s.pagesTotal ?? 0);
          if (pages <= 0) continue;

          if (pages > bestPages) {
            bestPages = pages;
            bestDate = s.date;
          }
        }

        if (!bestDate) return undefined;
        return { date: bestDate, pages: bestPages };
      },

      getBookStreak: (bookUri, todayDate) => {
        if (!bookUri || !todayDate) return 0;

        let streak = 0;
        let d = todayDate;

        while (true) {
          const key = makeBookKey(bookUri, d);
          const pages = get().byBookDate[key]?.pagesTotal ?? 0;
          if ((pages ?? 0) <= 0) break;

          streak += 1;
          d = addDays(d, -1);
        }

        return streak;
      },

      reset: () =>
        set({
          byDate: {},
          byBookDate: {},
          byTargetDate: {},
          lastEvent: undefined,
        }),
    }),
    {
      name: "reading-stats-v4",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
