import { StripMode, StripPos } from "@/components/Books/FloatingPageStrip";
import { ReadingMode } from "@budget/core";

export type ReadingScrollMode = "horizontal-paged" | "vertical-scroll";

export type CropKey = "none" | "trim" | "tight";


export type StripPrefs = {
    mode: StripMode;
    minimized: boolean;
    hidden: boolean;
    pos?: StripPos;
  };
  
  
  export type CropInsets = { l: number; r: number; t: number; b: number };
  
  export type ReaderPrefs = StripPrefs & {
    scrollMode: ReadingScrollMode;
    zoomPresetIndex: number;
    cropKey: CropKey;
  };
  

  export type ReadingContext= {
     mode: ReadingMode;
        date: string;
        bookUri?: string;
        targetId?: string;
        sectionId?: string;
        sectionTitle?: string;
  };