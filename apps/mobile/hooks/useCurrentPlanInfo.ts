// apps/mobile/features/books/useCurrentPlanInfo.ts

import { useMemo } from "react";
import dayjs from "dayjs";

import { useReadingPlanStore } from "@/store/bookshelf/useReadingPlanStore";
import { useBooksStore } from "@/store/bookshelf/useBooksStore";
import type { LocalPdfFile } from "@/utils/getPdfsDirectory";

export type CurrentPlanInfo = {
  name: string;
  isCompleted: boolean;
  totalCompleted: number;    // total pages read in the plan today
  totalPagesInPlan: number;  // today's total target (sum of all books' targets)
  currentBookName: string;
  currentBookUri: string;
  remainingInItem: number;   // remaining pages for today's target in the current book
  suggestedBookName: string; // suggestion like "continue with this book" when the plan is done
};

export type PlanItemWithMeta = {
  bookUri: string;
  bookName: string;
  targetPages: number;        // daily target (pagesPerDay)
  planCurrentPage: number;    // cursor within the plan (currentPageInBook)
  planPagesReadToday: number; // pages read today within the plan
  bookTotalPages?: number;    // actual total page count of the book (from global store)
};

export type CurrentPlanDetails = {
  summary: CurrentPlanInfo | null;
  items: PlanItemWithMeta[];
};

export const useCurrentPlanInfo = (
  pdfs: LocalPdfFile[]
): CurrentPlanDetails => {
  const activePlan = useReadingPlanStore((s) => s.activePlan);
  const progressMap = useBooksStore((s) => s.items);

  const today = dayjs().format("YYYY-MM-DD");

  return useMemo(() => {
    if (!activePlan || !activePlan.items || activePlan.items.length === 0) {
      return {
        summary: null,
        items: [],
      };
    }

    const { items, perBook } = activePlan;

    // --- Plan items + meta (for Plan Details screen) ---
    const itemsWithMeta: PlanItemWithMeta[] = items.map((it) => {
      const book = pdfs.find((b) => b.uri === it.bookUri);
      const planBook = perBook[it.bookUri];
      const globalProgress = progressMap[it.bookUri];

      return {
        bookUri: it.bookUri,
        bookName: book?.name ?? it.bookName ?? it.bookUri,
        targetPages: it.pagesPerDay,
        planCurrentPage: planBook?.currentPageInBook ?? 1,
        planPagesReadToday: planBook?.pagesReadToday ?? 0,
        bookTotalPages: globalProgress?.totalPages, // actual total pages of the book
      };
    });

    // --- Plan summary (for Bookshelf card) ---

    // Today's total target = sum of pagesPerDay for all books
    const totalPagesInPlan = items.reduce(
      (sum, it) => sum + it.pagesPerDay,
      0
    );

    // Total pages read in the plan today = sum of pagesReadToday for all books
    const totalCompleted = items.reduce((sum, it) => {
      const pb = perBook[it.bookUri];
      return sum + (pb?.pagesReadToday ?? 0);
    }, 0);

    const isCompleted = totalCompleted >= totalPagesInPlan;

    // Book that should currently be read:
    // First book whose daily target is NOT fully completed
    const currentItem = isCompleted
      ? null
      : items.find((it) => {
          const pb = perBook[it.bookUri];
          const read = pb?.pagesReadToday ?? 0;
          return read < it.pagesPerDay;
        });

    const currentPlanBookUri = currentItem?.bookUri ?? "";
    const currentPlanBook = currentItem
      ? pdfs.find((b) => b.uri === currentItem.bookUri)
      : undefined;

    const currentBookName =
      currentPlanBook?.name ?? currentItem?.bookName ?? "";
    const currentBookUri = currentPlanBook?.uri ?? currentPlanBookUri;

    const currentPlanBookProgress = currentItem
      ? perBook[currentItem.bookUri]
      : undefined;

    const remainingInItem =
      !isCompleted && currentItem
        ? Math.max(
            0,
            currentItem.pagesPerDay -
              (currentPlanBookProgress?.pagesReadToday ?? 0)
          )
        : 0;

    const fallbackBook = pdfs[0];

    const summary: CurrentPlanInfo = {
      name: activePlan.name,
      totalCompleted,
      totalPagesInPlan,
      isCompleted,
      currentBookName,
      currentBookUri,
      remainingInItem,
      suggestedBookName: fallbackBook?.name ?? "",
    };

    return {
      summary,
      items: itemsWithMeta,
    };
  }, [activePlan, pdfs, progressMap, today]);
};
