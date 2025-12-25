import { ReadingMode } from "@budget/core";

export type DailyTotals = {
  pages: number;
  minutes: number;
  sessions: number;
};

export type StreakState = {
  current: number;
  best: number;
  lastQualifiedDate: string | null; 
  freezeTokens: number; 
};

export type XPState = {
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
};

export type GamificationState = {
  hydrated: boolean;

  // dayKey -> totals
  daily: Record<string, DailyTotals>;

  streak: StreakState;
  xp: XPState;

  hydrate: () => Promise<void>;
  resetAll: () => Promise<void>;

  logReadingProgress: (args: {
    bookUri: string;
    at: number; // timestamp ms
    mode: ReadingMode;

    // you can supply either pagesDelta or from/to
    pagesDelta?: number;
    fromPage?: number;
    toPage?: number;

    minutesDelta?: number;
  }) => void;

  onTargetCompleted: (args: { at: number; bookUri: string }) => void;
  onPlanCompleted: (args: { at: number; bookUri: string }) => void;
};


export type GamificationSettings = {
    qualifyPagesPerDay: number;   // QUALIFY_PAGES
    xpPerPage: number;            // baseXpFromPages
    planMultiplier: number;       // modeMultiplier("plan")
    targetMultiplier: number;     // modeMultiplier("target")
    planCompleteBonus: number;    // onPlanCompleted
    targetCompleteBonus: number;  // onTargetCompleted
  };