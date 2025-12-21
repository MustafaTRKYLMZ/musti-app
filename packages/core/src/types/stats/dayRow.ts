import { ReadingMode } from "./readingMode";

export type DayRow = {
    date: string;
    pagesTotal: number;
    pagesByMode: Record<ReadingMode, number>;
  };
  