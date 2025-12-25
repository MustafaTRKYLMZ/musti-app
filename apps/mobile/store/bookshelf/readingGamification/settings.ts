import { GamificationSettings } from "./types";

  
  export const DEFAULT_GAMIFICATION_SETTINGS: GamificationSettings = {
    qualifyPagesPerDay: 10,
    xpPerPage: 2,
    planMultiplier: 1.1,
    targetMultiplier: 1.2,
    planCompleteBonus: 150,
    targetCompleteBonus: 250,
  };
  
  // basit clamp helpers (UI girerse safe olsun)
  export const clampNum = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(max, n));
  
  export const sanitizeSettings = (
    s: Partial<GamificationSettings> | null | undefined
  ): GamificationSettings => {
    const x = s ?? {};
    return {
      qualifyPagesPerDay: clampNum(Number(x.qualifyPagesPerDay ?? 10) || 10, 1, 200),
      xpPerPage: clampNum(Number(x.xpPerPage ?? 2) || 2, 0, 20),
      planMultiplier: clampNum(Number(x.planMultiplier ?? 1.1) || 1.1, 1, 3),
      targetMultiplier: clampNum(Number(x.targetMultiplier ?? 1.2) || 1.2, 1, 5),
      planCompleteBonus: clampNum(Number(x.planCompleteBonus ?? 150) || 150, 0, 5000),
      targetCompleteBonus: clampNum(Number(x.targetCompleteBonus ?? 250) || 250, 0, 5000),
    };
  };
  