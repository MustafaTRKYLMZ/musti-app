import { ReadingMode } from "./readingMode";

export type LastEvent = {
    date: string;
    mode: ReadingMode;
    page: number;
    bookUri?: string;
    targetId?: string;
    at: number; 
  };