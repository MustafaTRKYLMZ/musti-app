import { ReadingMode } from "./readingMode";

export type DailyReadingStat = {
    id: string; 
    date: string; 
    bookUri?: string; 
    targetId?: string; 
    pagesTotal: number;
    pagesByMode: Record<ReadingMode, number>;
    updatedAt: string; 
  };
  