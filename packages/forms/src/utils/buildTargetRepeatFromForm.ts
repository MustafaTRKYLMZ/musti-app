import type { TargetRepeat } from "@budget/core";
import { isValidTimeOfDay } from "../utils/normalizeTimeOfDay"; 


import { mergeDateWithTimeOfDay } from "./mergeDateWithTimeOfDay";
import { CreateTargetFormValues } from "../targets";


export const buildTargetRepeatFromForm=(
  vals: CreateTargetFormValues
): TargetRepeat | null => {
  if (!vals.repeat.enabled) return null;

  const interval = Math.max(1, Math.floor(Number(vals.repeat.interval) || 1));
  const time = vals.repeat.timeOfDay?.trim() || "00:00";
  const safeTime = isValidTimeOfDay(time) ? time : "00:00";

  let end: TargetRepeat["end"] | undefined = undefined;

  if (vals.repeat.endKind === "until") {
    const untilAt = mergeDateWithTimeOfDay(vals.repeat.untilDate, safeTime);
    end = { kind: "until", untilAt } as any;
  } else if (vals.repeat.endKind === "count") {
    const total = Math.max(1, Math.floor(Number(vals.repeat.countRemaining) || 1));
    end = { kind: "count", total, remaining: total } as any;
  }

  if (vals.repeat.freq === "weekly") {
    const wds =
      vals.repeat.weekdays?.length
        ? [...new Set(vals.repeat.weekdays)].filter((x) => x >= 0 && x <= 6)
        : [1];

    return {
      freq: "weekly",
      interval,
      weekdays: wds,
      timeOfDay: safeTime,
      end,
    };
  }

  return {
    freq: vals.repeat.freq as any,
    interval,
    timeOfDay: safeTime,
    end,
  };
}
