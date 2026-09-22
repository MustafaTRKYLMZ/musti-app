/** Normalize OCR noise before parsing heuristics run. */
export function preprocessReceiptText(rawText: string): string {
  const lines = rawText
    .replace(/\r\n/g, "\n")
    .replace(/[|]/g, "I")
    .replace(/€(\d)/g, "€ $1")
    .replace(/₺(\d)/g, "₺ $1")
    .replace(
      /(?:^|\n)\s*(?:\d+[ \t]+)?[Cc][Oo][ \t]+(\d+[.,]\d{2})\s*(?=\n|$)/gm,
      "\n€ $1"
    )
    .replace(/(?:^|\n)\s*[Oo]ver[ \t]+\d+[ \t]+[Cc][Oo]\s*(?=\n|$)/gm, "\n")
    .replace(/(?:^|\n)\s*[€eE][Cc][ \t]+(\d+[.,]\d{2})\s*(?=\n|$)/gm, "\n€ $1")
    .split("\n")
    .map((line) =>
      line
        .replace(/\s{2,}/g, " ")
        .replace(/(\d),(\d{2})(?!\d)/g, "$1.$2")
        .replace(/(\d)\.(\d{3}),(\d{2})(?!\d)/g, "$1$2.$3")
        .replace(/(\d+[.,]\d{2})[A-Za-z]\b/g, "$1")
        .trim()
    )
    .filter(Boolean);

  const merged: string[] = [];

  for (const line of lines) {
    const prev = merged[merged.length - 1];

    if (prev && isMoneyOnlyLine(line) && receiptLabelNeedsAmount(prev)) {
      merged[merged.length - 1] = `${prev} ${line}`;
      continue;
    }

    if (
      prev &&
      /^\d+\s+.+\s+\d+[.,]\d{2}$/i.test(prev) &&
      /^\d+[.,]\d{2}\s*[A-Za-z]?\s*$/i.test(line)
    ) {
      merged[merged.length - 1] = `${prev} ${line}`;
      continue;
    }

    if (
      prev &&
      !isReceiptLabel(prev) &&
      /^[A-Za-z].+\s+\d+[.,]\d{2}$/i.test(prev) &&
      /^\d+[.,]\d{2}\s*[A-Za-z]?\s*$/i.test(line)
    ) {
      merged[merged.length - 1] = `${prev} ${line}`;
      continue;
    }

    if (prev && /^\d+$/.test(prev) && /[A-Za-zÀ-ÿ]/.test(line)) {
      if (/^[Cc][Oo]\b/i.test(line.trim()) || isPlainMoneyLine(line)) {
        merged.push(line);
        continue;
      }
      merged[merged.length - 1] = `${prev} ${line}`;
      continue;
    }

    if (prev && looksLikeProductLabel(prev) && isPlainMoneyLine(line)) {
      merged[merged.length - 1] = `${prev} ${line}`;
      continue;
    }

    if (
      prev &&
      !isReceiptLabel(prev) &&
      /[A-Za-zÀ-ÿİıŞşĞğÜüÖö]$/.test(prev) &&
      isPlainMoneyLine(line)
    ) {
      merged[merged.length - 1] = `${prev} ${line}`;
      continue;
    }

    if (
      prev &&
      isPlainMoneyLine(prev) &&
      receiptLabelNeedsAmount(line)
    ) {
      merged[merged.length - 1] = `${line} ${prev}`;
      continue;
    }

    if (
      prev &&
      /^[A-Za-zÀ-ÿİıŞşĞğÜüÖö][A-Za-zÀ-ÿİıŞşĞğÜüÖö0-9\s.'-]{1,}$/.test(prev) &&
      /^\d+\s*[x×@]\s/.test(line)
    ) {
      merged[merged.length - 1] = `${prev} ${line}`;
      continue;
    }

    merged.push(line);
  }

  return merged.join("\n");
}

function lineAmount(line: string): number | null {
  const matches = [...line.matchAll(/(\d+[.,]\d{2})/g)];
  if (!matches.length) return null;
  const raw = matches[matches.length - 1][1].replace(",", ".");
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function isPlainMoneyLine(line: string): boolean {
  return /^\d+[.,]\d{2}$/.test(line.trim());
}

function isMoneyOnlyLine(line: string): boolean {
  return /^(?:€|EUR|₺|TL|\$|£)?\s*\d+[.,]\d{2}$/i.test(line.trim());
}

function isReceiptLabel(line: string): boolean {
  const trimmed = line.trim();
  if (
    /^(?:jouw\s+voordeel|voordeel|korting|discount|besparing|bonus)\b/i.test(
      trimmed
    )
  ) {
    return true;
  }
  return /^(?:subtotaal|subtotal|sub-total|totaal|total|toplam|btw|vat|kdv|te betalen|betaald|bedankt)\b/i.test(
    trimmed
  );
}

function receiptLabelNeedsAmount(line: string): boolean {
  return isReceiptLabel(line) && lineAmount(line) == null;
}

function looksLikeProductLabel(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3) return false;
  if (isReceiptLabel(trimmed)) return false;
  if (isMoneyOnlyLine(trimmed) || isPlainMoneyLine(trimmed)) return false;
  if (/^\d+[.,]\d{2}/.test(trimmed)) return false;
  return /[A-Za-zÀ-ÿİıŞşĞğÜüÖö]/.test(trimmed);
}
