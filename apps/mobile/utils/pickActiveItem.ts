import { ReadingTarget, TargetItem } from "@musti/core";

export const pickActiveItem = (t: ReadingTarget | null): TargetItem | null => {
    if (!t?.items?.length) return null;
    return t.items.find((it) => it.status === "active") ?? null;
  }
  