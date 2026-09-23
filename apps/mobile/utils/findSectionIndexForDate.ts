import { TxSection } from "@/components/transactions";
import dayjs from "dayjs";

export function findSectionIndexForDate(
  sections: TxSection[],
  targetKey?: string
): number {
  if (!sections.length) return -1;

  let sectionIndex = -1;

  if (targetKey) {
    const target = dayjs(targetKey).startOf("day");

    sectionIndex = sections.findIndex((s) => s.key === targetKey);

    if (sectionIndex === -1) {
      let bestBeforeIdx = -1;
      let bestBeforeDiff = Number.POSITIVE_INFINITY;

      sections.forEach((s, idx) => {
        if (s.key === "other") return;
        const d = dayjs(s.key).startOf("day");
        const diffDays = target.diff(d, "day");

        if (diffDays >= 0 && diffDays < bestBeforeDiff) {
          bestBeforeDiff = diffDays;
          bestBeforeIdx = idx;
        }
      });

      if (bestBeforeIdx !== -1) {
        sectionIndex = bestBeforeIdx;
      } else {
        let bestAfterIdx = -1;
        let bestAfterDiff = Number.POSITIVE_INFINITY;

        sections.forEach((s, idx) => {
          if (s.key === "other") return;
          const d = dayjs(s.key).startOf("day");
          const diffDays = d.diff(target, "day");

          if (diffDays >= 0 && diffDays < bestAfterDiff) {
            bestAfterDiff = diffDays;
            bestAfterIdx = idx;
          }
        });

        if (bestAfterIdx !== -1) {
          sectionIndex = bestAfterIdx;
        }
      }
    }
  }

  if (sectionIndex === -1) {
    sectionIndex = sections.findIndex((s) => s.position === "today");
  }

  return sectionIndex;
}
