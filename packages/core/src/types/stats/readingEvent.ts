import { ReadingMode } from "./readingMode";

export type ReadingEvent = {
  id: string;

  date: string; // YYYY-MM-DD
  at: number; // ms timestamp
  mode: ReadingMode;

  bookUri: string;

  targetId?: string;

  pageFrom: number;
  pageTo: number;

  sectionId?: string;
  sectionTitle?: string;

  durationMs?: number;
};
