import type { ReceiptLineDraft } from "../types/receipt";

const INLINE_QTY_PRICE_LINE =
  /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+[.,]\d{2})\s*=\s*(?:EUR\s*)?(\d+[.,]\d{2})/i;

const BLOCK_QTY_PRICE_LINE =
  /^(?:EUR\s*)?(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+[.,]\d{2})\s*=\s*(?:EUR\s*)?(\d+[.,]\d{2})/i;

const REGELS_LINE = /\bregels\s*[:\s]\s*\d+\b/i;
const NL_POSTCODE = /^\d{4}\s?[A-Z]{2}\b/i;

type ParsedPriceEntry = {
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  unit?: string;
};

function parseQuantity(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function parseMoney(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function isQtyPriceSummaryLine(line: string): boolean {
  return BLOCK_QTY_PRICE_LINE.test(line.trim());
}

function parseBlockQtyPriceLine(line: string): ParsedPriceEntry | null {
  const trimmed = line.trim();
  const match = trimmed.match(BLOCK_QTY_PRICE_LINE);
  if (!match) return null;

  const quantity = parseQuantity(match[1]);
  const unitPrice = parseMoney(match[2]);
  const totalAmount = parseMoney(match[3]);
  if (quantity == null || unitPrice == null || totalAmount == null) return null;

  const unit = /^\d+[.,]\d{2,3}$/.test(match[1].trim()) ? "kg" : undefined;
  return { quantity, unitPrice, totalAmount, unit };
}

function parseInlineQtyPriceLine(line: string): ReceiptLineDraft | null {
  const trimmed = line.trim();
  const match = trimmed.match(INLINE_QTY_PRICE_LINE);
  if (!match) return null;

  const name = match[1].replace(/\s+/g, " ").trim();
  const quantity = parseQuantity(match[2]);
  const unitPrice = parseMoney(match[3]);
  const totalAmount = parseMoney(match[4]);
  if (
    !name ||
    quantity == null ||
    unitPrice == null ||
    totalAmount == null ||
    name.length < 3
  ) {
    return null;
  }

  return {
    name,
    quantity,
    totalAmount,
    unitPrice,
  };
}

function isPositionalNameLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3) return false;
  if (isQtyPriceSummaryLine(trimmed)) return false;
  if (parseInlineQtyPriceLine(trimmed)) return false;
  if (REGELS_LINE.test(trimmed)) return false;
  if (NL_POSTCODE.test(trimmed)) return false;
  if (/^(?:kassa|kassabon|druk|cashier|terminal|bon|receipt|subtotaal|totaal|total|btw|betaald|netherlands|netherlanos)/i.test(trimmed)) {
    return false;
  }
  if (/^\d{2}:\d{2}$/.test(trimmed)) return false;
  if (/^\d{2}[./-]\d{2}[./-]\d{2,4}$/.test(trimmed)) return false;
  if (/^\d+[.,]\d{2}$/.test(trimmed)) return false;
  if (/^[A-Za-z]\s*$/.test(trimmed)) return false;
  if (/^(?:www\.|http|tel:|kvk|iban)/i.test(trimmed)) return false;
  if (/supermarkt|market|markt|straat|street|cad/i.test(trimmed) && trimmed.length < 28) {
    return false;
  }
  return /[A-Za-zÀ-ÿ]{3,}/.test(trimmed);
}

function findRegelsIndex(lines: string[]): number {
  return lines.findIndex((line) => REGELS_LINE.test(line.trim()));
}

function findPriceBlockStart(lines: string[], fromIndex: number): number {
  for (let i = fromIndex; i < lines.length; i++) {
    if (isQtyPriceSummaryLine(lines[i])) return i;
  }
  return -1;
}

export function extractPositionalBlockProducts(
  lines: string[],
  footerIdx: number
): ReceiptLineDraft[] {
  const scoped = lines.slice(0, footerIdx);
  const inlineItems: ReceiptLineDraft[] = [];
  const nameLines: string[] = [];

  const regelsIdx = findRegelsIndex(scoped);
  const priceStart =
    regelsIdx >= 0
      ? regelsIdx + 1
      : findPriceBlockStart(scoped, 0);
  const nameStop =
    regelsIdx >= 0 ? regelsIdx : priceStart >= 0 ? priceStart : scoped.length;

  for (let i = 0; i < scoped.length; i++) {
    const line = scoped[i];
    const inline = parseInlineQtyPriceLine(line);
    if (inline) {
      inlineItems.push(inline);
      continue;
    }
    if (i < nameStop && isPositionalNameLine(line)) {
      nameLines.push(line.trim().replace(/^\d+\s+/, "").trim());
    }
  }

  if (priceStart < 0) return inlineItems;

  const priceEntries: ParsedPriceEntry[] = [];
  for (const line of scoped.slice(priceStart)) {
    if (REGELS_LINE.test(line.trim())) continue;
    const parsed = parseBlockQtyPriceLine(line);
    if (parsed) priceEntries.push(parsed);
  }

  if (priceEntries.length === 0) return inlineItems;

  const uniqueNames = [...new Set(nameLines.map((name) => name.toLowerCase()))].map(
    (lower) => nameLines.find((name) => name.toLowerCase() === lower)!
  );

  const namesForBlock = uniqueNames.filter(
    (name) => !inlineItems.some((item) => item.name.toLowerCase() === name.toLowerCase())
  );

  const paired: ReceiptLineDraft[] = [...inlineItems];
  const pairCount = Math.min(namesForBlock.length, priceEntries.length);

  for (let i = 0; i < pairCount; i++) {
    const price = priceEntries[i];
    paired.push({
      name: namesForBlock[i],
      quantity: price.quantity,
      unit: price.unit,
      unitPrice: price.unitPrice,
      totalAmount: price.totalAmount,
    });
  }

  if (paired.length > inlineItems.length) return paired;

  return priceEntries.map((price, index) => ({
    name: namesForBlock[index] ?? `Item ${index + 1}`,
    quantity: price.quantity,
    unit: price.unit,
    unitPrice: price.unitPrice,
    totalAmount: price.totalAmount,
  }));
}
