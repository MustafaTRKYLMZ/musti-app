import { useMemo } from "react";
import { useReadingPlanStore } from "@/store/bookshelf/useReadingPlanStore";
import type { LocalPdfFile } from "@/utils/getPdfsDirectory";
import { CurrentPlanInfo } from "@/features/bookshelf/CurrentPlanCard";

export function useCurrentPlanInfo(_books?: LocalPdfFile[]) {
  const plans = useReadingPlanStore((s) => s.plans);

  const plan = useMemo(() => {
    return (plans ?? [])[0] ?? null; 
  }, [plans]);

  const summary = useMemo<CurrentPlanInfo | null>(() => {
    if (!plan) return null;
    if (!plan.items?.length) return null;

    const totalPagesInPlan = plan.items.reduce(
      (sum, it) => sum + (it.pagesPerDay || 0),
      0
    );

    const totalCompleted = plan.totalReadToday || 0;

    let currentBookName: string | undefined;
    let currentBookUri: string | undefined;
    let remainingInItem: number | undefined;

    for (const it of plan.items) {
      const pb = plan.perBook?.[it.bookUri];
      const readToday = pb?.pagesReadToday ?? 0;
      const target = it.pagesPerDay ?? 0;
      const remaining = Math.max(0, target - readToday);

      if (remaining > 0) {
        currentBookName = it.bookName;
        currentBookUri = it.bookUri;
        remainingInItem = remaining;
        break;
      }
    }

    if (!currentBookUri) {
      const first = plan.items[0];
      currentBookName = first.bookName;
      currentBookUri = first.bookUri;
      remainingInItem = 0;
    }

    const isCompleted =
      totalPagesInPlan > 0 ? totalCompleted >= totalPagesInPlan : false;

    const suggestedBookName = isCompleted ? plan.items[0]?.bookName : undefined;

    return {
      name: plan.name,
      isCompleted,
      totalCompleted,
      totalPagesInPlan,
      currentBookName,
      currentBookUri,
      remainingInItem,
      suggestedBookName,
    };
  }, [plan]);

  return { summary };
}
