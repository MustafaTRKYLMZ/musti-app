import { preprocessReceiptText } from "./preprocessReceiptText";

function toLines(text: string): string[] {
  return preprocessReceiptText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeLine(line: string): string {
  return line.toLowerCase().replace(/\s+/g, " ");
}

function linesSimilar(a: string, b: string): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;

  const amountA = a.match(/(\d+[.,]\d{2})/);
  const amountB = b.match(/(\d+[.,]\d{2})/);
  if (amountA && amountB && amountA[1] === amountB[1]) {
    const nameA = a.replace(amountA[0], "").trim();
    const nameB = b.replace(amountB[0], "").trim();
    if (nameA.length >= 2 && nameB.length >= 2) {
      return nameA.includes(nameB) || nameB.includes(nameA);
    }
  }

  return false;
}

function findOverlapSkip(linesA: string[], linesB: string[]): number {
  const maxOverlap = Math.min(14, linesA.length, linesB.length);

  for (let size = maxOverlap; size >= 1; size--) {
    const suffix = linesA.slice(-size).map(normalizeLine);
    const prefix = linesB.slice(0, size).map(normalizeLine);
    const matches = suffix.every((line, index) =>
      linesSimilar(line, prefix[index] ?? "")
    );
    if (matches) return size;
  }

  return 0;
}

/** Merge OCR from two photos of the same long receipt (top + bottom). */
export function mergeReceiptTexts(partA: string, partB: string): string {
  const trimmedA = partA.trim();
  const trimmedB = partB.trim();

  if (!trimmedA) return trimmedB;
  if (!trimmedB) return trimmedA;

  const linesA = toLines(trimmedA);
  const linesB = toLines(trimmedB);
  const skip = findOverlapSkip(linesA, linesB);
  const mergedLines = [...linesA, ...linesB.slice(skip)];

  return mergedLines.join("\n");
}
