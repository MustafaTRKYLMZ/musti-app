import { ReadingMode } from "/core";

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

export type LastGain = {
  at: number; // timestamp
  dayKey: string; // YYYY-MM-DD
  xp: number; // gained xp
  pages: number; // pagesDelta used
  mode: ReadingMode;
};

export type GamificationSettings = {
  // streak + xp
  qualifyPagesPerDay: number;
  xpPerPage: number;
  planMultiplier: number;
  targetMultiplier: number;
  planCompleteBonus: number;
  targetCompleteBonus: number;

  // ✅ motivation nudge
  motivationEnabled: boolean;
  motivationOnlyIfNotDone: boolean;
  motivationScheduleType: "daily" | "weekly";
  motivationWeekday: number; // 1-7 (Mon-Sun)
  motivationHour: number; // 0-23
  motivationMinute: number; // 0-59
};

export type GamificationState = {
  hydrated: boolean;

  daily: Record<string, DailyTotals>;
  streak: StreakState;
  xp: XPState;
  lastGain: LastGain | null;

  hydrate: () => Promise<void>;
  resetAll: () => Promise<void>;

  logReadingProgress: (args: {
    bookUri: string;
    at: number;
    mode: ReadingMode;

    pagesDelta?: number;
    fromPage?: number;
    toPage?: number;

    minutesDelta?: number;
  }) => number; 

  onTargetCompleted: (args: { at: number; bookUri: string }) => number;
  onPlanCompleted: (args: { at: number; bookUri: string }) => number;

  clearLastGain: () => void;
};
