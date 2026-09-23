import type { ReadingMode } from "@musti/core";

export const DEFAULT_EVENTS_DISPLAY_LIMIT = 12;

export const modeLabel: Record<ReadingMode, string> = {
  target: "Target",
  plan: "Plan",
  normal: "Normal",
};

export const modeIcon: Record<ReadingMode, string> = {
  target: "locate-outline",
  plan: "calendar-outline",
  normal: "book-outline",
};
