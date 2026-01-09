import { minuteToHHmm } from "./minuteToHHmm";
import { parseHHmm } from "./parseHHmm";

export const clampTimeOrder=(start: string, end: string)=> {
  const s = parseHHmm(start);
  const e = parseHHmm(end);
  if (!s || !e) return { start, end };

  const sMin = s.h * 60 + s.m;
  const eMin = e.h * 60 + e.m;

  if (eMin <= sMin) {
    return { start, end: minuteToHHmm(Math.min(24 * 60 - 1, sMin + 30)) };
  }
  return { start, end };
}
