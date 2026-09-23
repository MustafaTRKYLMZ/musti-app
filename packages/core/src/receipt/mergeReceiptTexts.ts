import { preprocessReceiptText } from "./preprocessReceiptText";

function toLines(text: string): string[] {
  return preprocessReceiptText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeLine(line: string): string {
  return line
    .toLowerCase()
    .replace(/[^\p{L}\p{N}.,=x×]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractPrimaryAmount(line: string): string | null {
  const matches = [...line.matchAll(/(\d+[.,]\d{2})/g)];
  return matches.length > 0 ? matches[matches.length - 1][1] : null;
}

function linesSimilar(a: string, b: string): boolean {
  const normA = normalizeLine(a);
  const normB = normalizeLine(b);
  if (!normA || !normB) return false;
  if (normA === normB) return true;
  if (normA.includes(normB) || normB.includes(normA)) return true;

  const amountA = extractPrimaryAmount(normA);
  const amountB = extractPrimaryAmount(normB);
  if (amountA && amountB && amountA === amountB) {
    const nameA = normA.replace(amountA, "").trim();
    const nameB = normB.replace(amountB, "").trim();
    if (nameA.length >= 2 && nameB.length >= 2) {
      return (
        nameA.includes(nameB) ||
        nameB.includes(nameA) ||
        nameA.slice(0, 8) === nameB.slice(0, 8)
      );
    }
    return true;
  }

  if (normA.length >= 8 && normB.length >= 8) {
    return normA.slice(0, 8) === normB.slice(0, 8);
  }

  return false;
}

function findOverlapSkip(linesA: string[], linesB: string[]): number {
  const maxOverlap = Math.min(20, linesA.length, linesB.length);

  for (let size = maxOverlap; size >= 1; size--) {
    const suffix = linesA.slice(-size);
    const prefix = linesB.slice(0, size);
    let matches = 0;

    for (let i = 0; i < size; i++) {
      if (linesSimilar(suffix[i] ?? "", prefix[i] ?? "")) {
        matches += 1;
      }
    }

    if (matches >= Math.max(1, Math.ceil(size * 0.7))) {
      return size;
    }
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

export function mergeManyReceiptTexts(parts: string[]): string {
  if (parts.length === 0) return "";
  return parts.reduce((merged, part) => mergeReceiptTexts(merged, part), "");
}
