import type { GamificationSettings } from "./types";

const clampInt = (n: any, min = 0, max = 999999) => {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
};

const clampNum = (n: any, min: number, max: number, fallback: number) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, v));
};

const clampBool = (b: any, fallback: boolean) =>
  typeof b === "boolean" ? b : fallback;

const clampScheduleType = (v: any): "daily" | "weekly" =>
  v === "weekly" ? "weekly" : "daily";

export const DEFAULT_GAMIFICATION_SETTINGS: GamificationSettings = {
  qualifyPagesPerDay: 10,
  xpPerPage: 2,
  planMultiplier: 1.1,
  targetMultiplier: 1.2,
  planCompleteBonus: 150,
  targetCompleteBonus: 250,

  motivationEnabled: false,
  motivationOnlyIfNotDone: true,
  motivationScheduleType: "daily",
  motivationWeekday: 1, // Monday
  motivationHour: 20,
  motivationMinute: 30,
};

export function sanitizeSettings(
  input?: Partial<GamificationSettings> | null
): GamificationSettings {
  const s = input ?? {};

  return {
    qualifyPagesPerDay: clampInt(s.qualifyPagesPerDay, 1, 200),
    xpPerPage: clampInt(s.xpPerPage, 0, 50),

    planMultiplier: clampNum(s.planMultiplier, 1, 5, DEFAULT_GAMIFICATION_SETTINGS.planMultiplier),
    targetMultiplier: clampNum(s.targetMultiplier, 1, 10, DEFAULT_GAMIFICATION_SETTINGS.targetMultiplier),

    planCompleteBonus: clampInt(s.planCompleteBonus, 0, 999999),
    targetCompleteBonus: clampInt(s.targetCompleteBonus, 0, 999999),

    motivationEnabled: clampBool(s.motivationEnabled, DEFAULT_GAMIFICATION_SETTINGS.motivationEnabled),
    motivationOnlyIfNotDone: clampBool(
      s.motivationOnlyIfNotDone,
      DEFAULT_GAMIFICATION_SETTINGS.motivationOnlyIfNotDone
    ),
    motivationScheduleType: clampScheduleType(s.motivationScheduleType),
    motivationWeekday: clampInt(s.motivationWeekday, 1, 7),
    motivationHour: clampInt(s.motivationHour, 0, 23),
    motivationMinute: clampInt(s.motivationMinute, 0, 59),
  };
}
