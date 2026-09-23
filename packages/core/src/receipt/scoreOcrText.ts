import { extractDeclaredItemCount } from "./extractDeclaredItemCount";

const TOTAL_KEYWORDS =
  /\b(total|toplam|te betalen|bedrag|amount due|grand total|saldo|totaal|eindtotaal)\b/i;

/** Higher score = better OCR candidate for parser heuristics. */
export function scoreOcrText(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;

  let score = trimmed.length;

  const moneyMatches = trimmed.match(/\d+[.,]\d{2}/g);
  score += (moneyMatches?.length ?? 0) * 18;

  const nonEmptyLines = trimmed.split("\n").filter((line) => line.trim());
  score += nonEmptyLines.length * 6;

  if (TOTAL_KEYWORDS.test(trimmed)) score += 45;

  const declared = extractDeclaredItemCount(trimmed);
  if (declared != null) score += 25;

  if (/\b(regels|artikel|artikel|items?)\b/i.test(trimmed)) score += 15;

  return score;
}

export function pickBestOcrText(candidates: string[]): string {
  if (candidates.length === 0) return "";
  if (candidates.length === 1) return candidates[0];

  let best = candidates[0];
  let bestScore = scoreOcrText(best);

  for (let i = 1; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    const score = scoreOcrText(candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}
