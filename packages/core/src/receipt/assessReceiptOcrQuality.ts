import type { ParseReceiptResult } from "../types/receipt";
import { extractDeclaredItemCount } from "./extractDeclaredItemCount";

export type ReceiptOcrQualityLevel = "good" | "fair" | "poor";

export type ReceiptOcrQuality = {
  level: ReceiptOcrQualityLevel;
  charCount: number;
  lineCount: number;
  declaredItemCount: number | null;
  pricedLineCount: number;
  suggestRetake: boolean;
  suggestSecondPhoto: boolean;
  suggestThirdPhoto: boolean;
  /** True when another section photo may improve completeness (photoCount < max). */
  suggestMorePhotos: boolean;
  suggestSaveTotalOnly: boolean;
};

const TOTAL_KEYWORDS =
  /\b(total|toplam|te betalen|bedrag|amount due|grand total|saldo|€)\b/i;

export const MAX_RECEIPT_PHOTOS = 5;

function countNonEmptyLines(text: string): number {
  return text.split("\n").filter((line) => line.trim().length > 0).length;
}

function hasLowConfidenceHints(result: ParseReceiptResult): boolean {
  return (
    result.hints.total.confidence === "low" ||
    result.hints.store.confidence === "low"
  );
}

function isDeclaredCountIncomplete(
  declaredItemCount: number | null,
  pricedLineCount: number,
  ratio = 0.65
): boolean {
  if (declaredItemCount == null) return false;
  return pricedLineCount < Math.max(3, Math.floor(declaredItemCount * ratio));
}

function shouldSuggestMorePhotos(input: {
  photoCount: number;
  maxPhotos: number;
  suggestRetake: boolean;
  charCount: number;
  hasTotal: boolean;
  hasFooterTotalHint: boolean;
  pricedLineCount: number;
  declaredItemCount: number | null;
  parseResult: ParseReceiptResult;
}): boolean {
  const {
    photoCount,
    maxPhotos,
    suggestRetake,
    charCount,
    hasTotal,
    hasFooterTotalHint,
    pricedLineCount,
    declaredItemCount,
    parseResult,
  } = input;

  if (photoCount >= maxPhotos || suggestRetake) return false;

  if (isDeclaredCountIncomplete(declaredItemCount, pricedLineCount, 0.85)) {
    return true;
  }

  if (!hasTotal && charCount >= 180 + photoCount * 40) {
    return true;
  }

  if (
    declaredItemCount != null &&
    declaredItemCount >= 20 &&
    pricedLineCount < declaredItemCount - Math.max(2, photoCount)
  ) {
    return true;
  }

  if (
    photoCount === 1 &&
    charCount >= 140 &&
    charCount < 420 &&
    pricedLineCount >= 4 &&
    parseResult.hints.total.confidence !== "high"
  ) {
    return true;
  }

  if (
    photoCount === 1 &&
    charCount >= 180 &&
    pricedLineCount >= 6 &&
    !hasFooterTotalHint
  ) {
    return true;
  }

  if (
    photoCount === 1 &&
    pricedLineCount >= 10 &&
    parseResult.hints.total.confidence === "low"
  ) {
    return true;
  }

  if (
    photoCount === 1 &&
    declaredItemCount != null &&
    isDeclaredCountIncomplete(declaredItemCount, pricedLineCount, 0.65)
  ) {
    return true;
  }

  if (
    photoCount === 1 &&
    declaredItemCount != null &&
    !hasTotal &&
    charCount >= 120
  ) {
    return true;
  }

  return false;
}

export function assessReceiptOcrQuality(
  text: string,
  parseResult: ParseReceiptResult,
  options?: { photoCount?: number; maxPhotos?: number }
): ReceiptOcrQuality {
  const trimmed = text.trim();
  const charCount = trimmed.length;
  const lineCount = countNonEmptyLines(trimmed);
  const photoCount = options?.photoCount ?? 1;
  const maxPhotos = options?.maxPhotos ?? MAX_RECEIPT_PHOTOS;
  const parsedLineCount = parseResult.draft.lines.length;
  const declaredItemCount = extractDeclaredItemCount(trimmed);
  const hasTotal = parseResult.draft.total > 0;
  const hasFooterTotalHint = TOTAL_KEYWORDS.test(trimmed);
  const pricedLineCount = parseResult.draft.lines.filter(
    (line) => (line.totalAmount ?? 0) > 0
  ).length;

  const suggestRetake =
    charCount < 60 ||
    (charCount < 120 && !hasTotal && parsedLineCount === 0) ||
    (charCount < 90 && hasLowConfidenceHints(parseResult) && !hasTotal);

  const suggestMorePhotos = shouldSuggestMorePhotos({
    photoCount,
    maxPhotos,
    suggestRetake,
    charCount,
    hasTotal,
    hasFooterTotalHint,
    pricedLineCount,
    declaredItemCount,
    parseResult,
  });

  const suggestSecondPhoto = photoCount === 1 && suggestMorePhotos;
  const suggestThirdPhoto = photoCount === 2 && suggestMorePhotos;

  const suggestSaveTotalOnly =
    hasTotal &&
    (parsedLineCount === 0 ||
      suggestRetake ||
      (charCount < 160 && parsedLineCount <= 2));

  let level: ReceiptOcrQualityLevel = "good";
  if (
    suggestRetake ||
    charCount < 80 ||
    (!hasTotal && parsedLineCount === 0)
  ) {
    level = "poor";
  } else if (
    suggestMorePhotos ||
    suggestSaveTotalOnly ||
    charCount < 220 ||
    hasLowConfidenceHints(parseResult) ||
    (hasTotal && parsedLineCount === 0) ||
    isDeclaredCountIncomplete(declaredItemCount, pricedLineCount, 0.8)
  ) {
    level = "fair";
  }

  return {
    level,
    charCount,
    lineCount,
    declaredItemCount,
    pricedLineCount,
    suggestRetake,
    suggestSecondPhoto,
    suggestThirdPhoto,
    suggestMorePhotos,
    suggestSaveTotalOnly,
  };
}
