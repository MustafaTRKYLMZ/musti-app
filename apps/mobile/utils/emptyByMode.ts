import { ReadingMode } from "@musti/core";

export const emptyByMode = (): Record<ReadingMode, number> => ({
    normal: 0,
    plan: 0,
    target: 0,
  });
  