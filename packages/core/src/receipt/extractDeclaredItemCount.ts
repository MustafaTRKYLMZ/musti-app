import { MAX_RECEIPT_LINE_ITEMS } from "./inferReceiptMetadata";

const DECLARED_COUNT_PATTERNS = [
  /\bregels\s*[:\s]\s*(\d+)\b/i,
  /\bartikel(?:en)?\s*[:\s]\s*(\d+)\b/i,
  /\bitems?\s*[:\s]\s*(\d+)\b/i,
  /\b(?:ürün|urun|kalem)\s*[:\s]\s*(\d+)\b/i,
  /\b(?:pos|regel)\s*[:\s]\s*(\d+)\b/i,
];

export function extractDeclaredItemCount(text: string): number | null {
  for (const pattern of DECLARED_COUNT_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    const count = Number(match[1]);
    if (
      Number.isFinite(count) &&
      count > 0 &&
      count <= MAX_RECEIPT_LINE_ITEMS
    ) {
      return count;
    }
  }
  return null;
}
