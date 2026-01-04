import type { ReadingMode } from "/core";

export type BookRow = {
  bookUri: string;
  bookName: string;
  pagesTotal: number;
  pagesByMode: Record<ReadingMode, number>;
};

export type SimpleTopRow = {
  bookUri: string;
  bookName: string;
  pages: number;
};
