import { ReadingMode } from "./readingMode";

export type ReadingEvent = {
    id: string;

    date: string; 
    at: number; 
    mode: ReadingMode;
    
    bookUri: string;

    targetId?: string;

    pageFrom: number;
    pageTo: number;

    sectionId?: string;
    sectionTitle?: string;
  };