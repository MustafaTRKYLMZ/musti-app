import { BookSection } from "/core";
import { clampPage, toIntOr } from "./number";

export const buildEffectiveRanges = (
  sections: BookSection[],
  totalPages: number | null
) => {
  const sorted = [...sections].sort((a, b) => a.startPage - b.startPage);

  const ranges = sorted.map((s, idx) => {
    const start = clampPage(s.startPage);

    const next = sorted[idx + 1];
    const nextStart = next ? clampPage(next.startPage) : null;

    let end: number;
    if (s.endPage != null) {
      end = Math.max(start, toIntOr(s.endPage, start));
    } else if (nextStart != null) {
      end = Math.max(start, nextStart - 1);
    } else if (typeof totalPages === "number" && totalPages > 0) {
      end = Math.max(start, totalPages);
    } else {
      end = Number.POSITIVE_INFINITY;
    }

    return {
      id: s.id,
      title: s.title,
      start,
      end,
    };
  });

  return ranges;
};