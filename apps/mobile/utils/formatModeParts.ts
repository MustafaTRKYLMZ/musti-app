import { ReadingMode, type TranslationKey } from "@musti/core";
import { toNonNegativeInt } from "./toNonNegativeInt";

export const formatModeParts = (pagesByMode: Record<ReadingMode, number>) => {
  const parts: Array<{
    mode: ReadingMode;
    value: number;
    icon: string;
    labelKey: TranslationKey;
  }> = [
    {
      mode: "target",
      value: toNonNegativeInt(pagesByMode?.target ?? 0),
      icon: "locate-outline",
      labelKey: "bookshelf.mode.target" as TranslationKey,
    },
    {
      mode: "plan",
      value: toNonNegativeInt(pagesByMode?.plan ?? 0),
      icon: "calendar-outline",
      labelKey: "bookshelf.mode.plan" as TranslationKey,
    },
    {
      mode: "normal",
      value: toNonNegativeInt(pagesByMode?.normal ?? 0),
      icon: "book-outline",
      labelKey: "bookshelf.mode.normal" as TranslationKey,
    },
  ];

  return parts.filter((p) => p.value > 0);
};