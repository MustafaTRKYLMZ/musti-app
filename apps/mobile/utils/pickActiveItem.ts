import { ReadingTarget, TargetItem } from "@/store/bookshelf/useReadingTargetsStore";

export const pickActiveItem = (t: ReadingTarget | null): TargetItem | null => {
    if (!t?.items?.length) return null;
    return t.items.find((it) => it.status === "active") ?? null;
  }
  