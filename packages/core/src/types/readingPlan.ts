import type { BookId } from "./book";

export type ReadingSegmentId = string;
export type DailyPlanId = string;

export interface ReadingSegment {
  id: ReadingSegmentId;
  bookId: BookId;
  startPage: number;
  endPage: number;
  order: number; 
  completed: boolean;
}

export interface DailyReadingPlan {
  id: DailyPlanId;
  date: string; // YYYY-MM-DD
  segments: ReadingSegment[];
  createdAt: string;
  updatedAt: string;
}
