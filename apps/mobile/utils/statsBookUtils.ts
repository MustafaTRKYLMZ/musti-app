import { toNonNegativeInt } from "@/utils/toNonNegativeInt";
import  { ReadingEvent , PageRange } from "/core";


export const normalizeRange = (from: number, to: number): PageRange => {
  const a = toNonNegativeInt(Math.min(from, to));
  const b = toNonNegativeInt(Math.max(from, to));
  return { a, b };
};

export const rangeCount = (from: number, to: number) => {
  const r = normalizeRange(from, to);
  if (r.b < r.a) return 0;
  return r.b - r.a + 1;
};

export const sumMergedRanges = (ranges: PageRange[]) => {
  if (!ranges.length) return 0;
  const sorted = [...ranges].sort((r1, r2) => r1.a - r2.a);

  let total = 0;
  let curA = sorted[0].a;
  let curB = sorted[0].b;

  for (let i = 1; i < sorted.length; i++) {
    const r = sorted[i];
    if (r.a <= curB + 1) {
      curB = Math.max(curB, r.b);
    } else {
      total += curB - curA + 1;
      curA = r.a;
      curB = r.b;
    }
  }
  total += curB - curA + 1;
  return Math.max(0, total);
};

export const getSectionLabel = (e: ReadingEvent) => {
  const raw = (e.sectionTitle || e.sectionId || "").trim();
  return raw.length ? raw : "—";
};

export const computeTopSection = (dayEvents: ReadingEvent[]) => {
  if (!dayEvents.length)
    return null as null | {
      label: string;
      pages: number;
      sectionsCount: number;
    };

  const groups: Record<string, PageRange[]> = {};
  for (const e of dayEvents) {
    const key = getSectionLabel(e);
    if (!groups[key]) groups[key] = [];
    groups[key].push(normalizeRange(e.pageFrom, e.pageTo));
  }

  const rows = Object.entries(groups)
    .map(([label, ranges]) => ({ label, pages: sumMergedRanges(ranges) }))
    .filter((r) => r.pages > 0);

  if (!rows.length) return null;
  rows.sort((a, b) => b.pages - a.pages);

  return {
    label: rows[0].label,
    pages: rows[0].pages,
    sectionsCount: rows.length,
  };
};

export const computeTopSections = (events: ReadingEvent[], limit = 4) => {
  if (!events.length) return [];

  const groups: Record<string, PageRange[]> = {};
  for (const e of events) {
    const key = getSectionLabel(e);
    if (!groups[key]) groups[key] = [];
    groups[key].push(normalizeRange(e.pageFrom, e.pageTo));
  }

  const rows = Object.entries(groups)
    .map(([label, ranges]) => ({ label, pages: sumMergedRanges(ranges) }))
    .filter((r) => r.pages > 0);

  rows.sort((a, b) => b.pages - a.pages);
  return rows.slice(0, limit);
};
