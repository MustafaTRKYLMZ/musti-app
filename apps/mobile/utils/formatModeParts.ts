import { ReadingMode } from "/core";
import { toNonNegativeInt } from "./toNonNegativeInt";

export const formatModeParts = (pagesByMode: Record<ReadingMode, number>) => {
  const parts: Array<{
    mode: ReadingMode;
    value: number;
    icon: string;
    label: string;
  }> = [
    {
      mode: "target",
      value: toNonNegativeInt(pagesByMode?.target ?? 0),
      icon: "locate-outline",
      label: "Target",
    },
    {
      mode: "plan",
      value: toNonNegativeInt(pagesByMode?.plan ?? 0),
      icon: "calendar-outline",
      label: "Plan",
    },
    {
      mode: "normal",
      value: toNonNegativeInt(pagesByMode?.normal ?? 0),
      icon: "book-outline",
      label: "Normal",
    },
  ];

  return parts.filter((p) => p.value > 0);
};