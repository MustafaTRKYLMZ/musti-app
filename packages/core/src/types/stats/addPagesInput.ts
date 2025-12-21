import {ReadingMode} from "./readingMode";

export type AddPagesInput = {
    date: string; 
    pages: number;
    mode: ReadingMode;
    bookUri?: string; 
    targetId?: string; 
  };