import { addDays, startOfWeek } from "@musti/planner";

/** Monday-start column order: Mon … Sun */
const WEEKDAY_LETTERS: Record<string, string[]> = {
  en: ["M", "T", "W", "Th", "F", "St", "Su"],
  tr: ["P", "S", "Ç", "P", "C", "Ct", "P"],
};

function localeKey(locale?: string): string {
  if (locale?.startsWith("tr")) return "tr";
  if (locale?.startsWith("nl")) return "nl";
  return "en";
}

function lettersForLocale(locale?: string, weekStartsOn = 1): string[] {
  const key = localeKey(locale);
  if (key === "nl") {
    return weekStartsOn === 1
      ? ["M", "D", "W", "D", "V", "Z", "Z"]
      : ["Z", "M", "D", "W", "D", "V", "Z"];
  }
  return WEEKDAY_LETTERS[key] ?? WEEKDAY_LETTERS.en;
}

export function formatTime(iso: string, locale = "en-EN") {
  const d = new Date(iso);
  return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

export function getWeekdayLetter(
  d: Date,
  locale: string = "en",
  weekStartsOn = 1
): string {
  const day = d.getDay();
  const col =
    weekStartsOn === 1 ? (day === 0 ? 6 : day - 1) : day;
  const letters = lettersForLocale(locale, weekStartsOn);
  return letters[col] ?? letters[0];
}

/** Stable Mon–Sun (or locale week start) dates for a fixed header row. */
export function getWeekdayHeaderDays(weekStartsOn = 1): Date[] {
  const anchor = new Date(2024, 0, 1);
  const start = startOfWeek(anchor, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export const eventToTitle = (e: any): string => {
  return e?.title ?? e?.name ?? e?.summary ?? e?.text ?? e?.label ?? "Event";
};

export function hhmmToDate(hhmm: string) {
  const [h, m] = (hhmm || "00:00").split(":").map(Number);
  const d = new Date();
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}
