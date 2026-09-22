import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import type {
  ParseReceiptResult,
  ReceiptDraft,
  ReceiptLineDraft,
} from "../types/receipt";
import { preprocessReceiptText } from "./preprocessReceiptText";
import {
  extractFuelLineItem,
  inferReceiptCategory,
  inferReceiptDescription,
  isFuelReceipt,
  MAX_RECEIPT_LINE_ITEMS,
} from "./inferReceiptMetadata";

dayjs.extend(customParseFormat);

const GRAND_TOTAL_LINE =
  /(?:^|[^a-z])(?:grand\s+total|te betalen|amount due|balance due|genel toplam|ödenecek tutar|odenecek tutar|totaal te betalen|totale te betalen|eindtotaal|totaal\b|total\b|toplam\b)(?:[^a-z]|$)/i;

const SUBTOTAL_LINE =
  /^(?:subtotal|subtotaal|sub-total|sub\s*total|aratoplam|ara toplam|som\b|bedrag excl|excl\.?\s*btw|excl\.?\s*vat|netto\b)/i;

const TAX_TOTAL_LINE =
  /^(?:btw|vat|kdv|tax|vergi|mwst|omzetbelasting|sales tax|belasting)\b/i;

const DISCOUNT_LINE =
  /^(?:jouw\s+voordeel|voordeel|korting|discount|besparing|bonuskorting|spaaractie|actie|melding|ah\s+bonus|bonus\s*bedrag)/i;

const MONEY_ONLY_LINE =
  /^(?:€|EUR|₺|TL|\$|£)?\s*\d+[.,]\d{2}$/i;

const DATE_PATTERNS = [
  /(\d{4}-\d{2}-\d{2})/,
  /(?:TARİH|TARIH|DATUM|DATE)[:\s]*(\d{2})[./-](\d{2})[./-](\d{4})/i,
  /(\d{2})[./-](\d{2})[./-](\d{4})/,
  /(\d{2})[./-](\d{2})[./-](\d{2})/,
];

const STORE_SKIP =
  /^(www\.|http|tel:|kvk|btw|vat|iban|bedankt|thank|welcome|bon|receipt|fiscaal|fiş|fis|vergi|kdv|müşteri|musteri)/i;

const STORE_HEADER_NOISE =
  /^(artikel|art\b|kopie|kass|medewerker|pump|pomp|terminal|transactie|pompa|no\b|pump\s*no|station\s*no|tankstation|tankstation|bedrijf|klant|customer|copy|duplicate|merchant|terminal\s*id|auth|approval|aid|mid\b|tid\b|rrn\b|stan\b|batch|shift|operator|cashier|bonnr|bon\s*nr|trans\s*nr|factuur|invoice|nr\b|ref\b|reference|kaart|card|pin\b|chip|contactless|contactloos|aantal|omschri|omscri|prijs|bedrag|quantity|description|amount|unit\s*price)/i;

/** Dutch receipt column header row, e.g. "Aantal Omschrijving Prijs Bedrag". */
function isReceiptColumnHeader(line: string): boolean {
  const lower = line.toLowerCase();
  let hits = 0;
  if (/\baantal\b|\bqty\b|\bquantity\b/.test(lower)) hits++;
  if (/omschri|omscri|description|product/.test(lower)) hits++;
  if (/\bprijs\b|\bprice\b|\bprix\b/.test(lower)) hits++;
  if (/\bbedrag\b|\bamount\b|\btotal\b/.test(lower)) hits++;
  return hits >= 2;
}

function inferStoreFromProductLines(lines: string[]): string | null {
  const haystack = lines.join("\n").toLowerCase();
  if (/\b\d+\s+ah\s+/.test(haystack) || /\bah\s+[a-z]/.test(haystack)) {
    return "Albert Heijn";
  }
  if (/\bjumbo\b/.test(haystack)) return "Jumbo";
  if (/\blidl\b/.test(haystack)) return "Lidl";
  if (/\baldi\b/.test(haystack)) return "Aldi";
  if (/\bplus\b/.test(haystack) && /\b(betaald|pin|subtotaal)\b/.test(haystack)) {
    return "Plus";
  }
  if (/\bmigros\b/.test(haystack)) return "Migros";
  return null;
}

const NL_POSTCODE = /^\d{4}\s?[A-Z]{2}\b/;

const FUEL_BRAND_IN_TEXT =
  /\b(shell|bp|tinq|tamoil|texaco|omv|q8|avia|esso|total\s*energies?|petrol\s*ofisi|sunoco)\b/i;

const KNOWN_STORES = [
  "jumbo",
  "albert heijn",
  "ah",
  "lidl",
  "aldi",
  "plus",
  "dirk",
  "coop",
  "spar",
  "migros",
  "bim",
  "a101",
  "carrefour",
  "carrefoursa",
  "tesco",
  "sainsbury",
  "şok",
  "sok",
  "hakmar",
  "metro",
  "makro",
  "action",
  "kruidvat",
  "etos",
  "shell",
  "bp",
  "tamoil",
  "texaco",
  "omv",
  "q8",
  "avia",
  "tinq",
  "esso",
  "total energies",
  "petrol ofisi",
];

function parseMoney(raw: string): number | null {
  const cleaned = raw.trim().replace(/[^\d.,]/g, "");
  if (!cleaned) return null;

  const normalized =
    cleaned.includes(",") && cleaned.includes(".")
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned.replace(",", ".");

  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function extractDate(text: string): { value: string; confidence: "high" | "medium" | "low" } {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;

    if (match.length === 2) {
      return { value: match[1], confidence: "high" };
    }

    const dd = match[1];
    const mm = match[2];
    let yyyy = match[3];
    if (yyyy.length === 2) {
      yyyy = Number(yyyy) > 70 ? `19${yyyy}` : `20${yyyy}`;
    }

    const parsed = dayjs(`${yyyy}-${mm}-${dd}`, "YYYY-MM-DD", true);
    if (parsed.isValid()) {
      return { value: parsed.format("YYYY-MM-DD"), confidence: "high" };
    }
  }

  return { value: dayjs().format("YYYY-MM-DD"), confidence: "low" };
}

function extractMoneyFromLine(line: string): number | null {
  const matches = [...line.matchAll(/(\d+[.,]\d{2})/g)];
  if (!matches.length) return null;
  return parseMoney(matches[matches.length - 1][1]);
}

function isTaxLine(line: string): boolean {
  const trimmed = line.trim();
  if (TAX_TOTAL_LINE.test(trimmed)) return true;
  return /\b(?:btw|vat|kdv)\b/i.test(trimmed) && extractMoneyFromLine(trimmed) != null;
}

function isDiscountLine(line: string): boolean {
  const trimmed = line.trim();
  if (DISCOUNT_LINE.test(trimmed)) return true;
  return /\b(?:jouw\s+voordeel|voordeel|korting|besparing)\b/i.test(trimmed);
}

const PRODUCT_NAME_NOISE =
  /^(?:co|over|sub|tot|btw|vat|bedrag|prijs|aantal|eur|pin|bonus|jouw|voordeel)\b/i;

function isOcrGarbageLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (/^(?:\d+[ \t]+)?[Cc][Oo][ \t]+\d+[.,]\d{2}$/.test(trimmed)) return true;
  if (/^[Oo]ver[ \t]+\d+[ \t]+[Cc][Oo]$/i.test(trimmed)) return true;
  if (/^\d+[.,]\d{2}[ \t]+[Xx]{1,2}\d{4,}$/.test(trimmed)) return true;
  if (/^[Xx]{1,2}\d{5,}$/.test(trimmed.replace(/\s/g, ""))) return true;
  return false;
}

function isValidProductName(name: string): boolean {
  const cleaned = name.trim();
  if (cleaned.length < 3) return false;
  if (/^[A-Za-z]$/.test(cleaned)) return false;
  if (!/[A-Za-zÀ-ÿİıŞşĞğÜüÖö]{2,}/.test(cleaned)) return false;
  if (PRODUCT_NAME_NOISE.test(cleaned)) return false;
  if (/^\d+\s+[A-Za-z]{1,4}$/i.test(cleaned)) return false;
  if (/^[Xx]{1,2}\d{4,}$/.test(cleaned.replace(/\s/g, ""))) return false;
  if (/\d{5,}/.test(cleaned)) return false;
  if (
    cleaned.length < 6 &&
    !/^(?:AH|JUMBO|PLUS|LIDL|ALDI)\b/i.test(cleaned)
  ) {
    return false;
  }
  return true;
}

function sumTaxAmounts(footer: string[]): number {
  return footer
    .filter((line) => isTaxLine(line))
    .map((line) => extractMoneyFromLine(line))
    .filter((n): n is number => n != null && n > 0)
    .reduce((sum, value) => sum + value, 0);
}

function isMoneyOnlyLine(line: string): boolean {
  return MONEY_ONLY_LINE.test(line.trim());
}

function isSubtotalLine(line: string): boolean {
  const trimmed = line.trim();
  if (SUBTOTAL_LINE.test(trimmed)) return true;
  return /\bsub\s*total\b/i.test(trimmed) && !GRAND_TOTAL_LINE.test(trimmed);
}

function isGrandTotalLine(line: string): boolean {
  const trimmed = line.trim();
  if (isTaxLine(trimmed) || isSubtotalLine(trimmed)) return false;
  return GRAND_TOTAL_LINE.test(trimmed);
}

function amountOnSameOrNextLine(
  footer: string[],
  index: number
): number | null {
  const line = footer[index];
  const sameLine = extractMoneyFromLine(line);
  if (sameLine != null) return sameLine;

  const next = footer[index + 1];
  if (next && isMoneyOnlyLine(next)) {
    return extractMoneyFromLine(next);
  }

  const prev = footer[index - 1];
  if (prev && isMoneyOnlyLine(prev)) {
    return extractMoneyFromLine(prev);
  }

  return null;
}

function isCashPaymentSectionLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    /^contant\b/i.test(trimmed) ||
    /^betaald met:/i.test(trimmed) ||
    /^over\b/i.test(trimmed) ||
    /^wisselgeld\b/i.test(trimmed)
  );
}

function parseStandaloneMoneyLine(line: string): number | null {
  const trimmed = line.trim();
  if (!/^\d+[.,]\d{2}\s*$/.test(trimmed)) return null;
  return parseMoney(trimmed);
}

/** Read the amount printed on the receipt — never derive from cash − change. */
function findPrintedReceiptTotal(lines: string[]): number | null {
  for (let i = 0; i < lines.length - 1; i++) {
    const amount = parseStandaloneMoneyLine(lines[i]);
    const next = parseStandaloneMoneyLine(lines[i + 1]);
    if (amount == null || next == null) continue;
    if (
      next >= 10 &&
      Number.isInteger(next) &&
      amount > 0 &&
      amount < next &&
      amount < 100
    ) {
      return amount;
    }
  }

  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (isSubtotalLine(trimmed)) continue;
    if (!/^totaal\b/i.test(trimmed)) continue;
    const amount =
      amountOnSameOrNextLine(lines, i) ?? amountNearTotaalLabel(lines, i);
    if (amount != null && amount > 0 && amount < 500) return amount;
  }

  return null;
}

function amountNearTotaalLabel(lines: string[], index: number): number | null {
  const candidates: number[] = [];

  for (let j = Math.max(0, index - 3); j < lines.length; j++) {
    const line = lines[j].trim();
    if (isCashPaymentSectionLine(line)) break;
    if (isOcrGarbageLine(line) || isTaxLine(line)) continue;
    if (isSubtotalLine(line) && j !== index) continue;
    if (/^totaal\b/i.test(line) && j !== index) continue;
    if (/^\d+[.,]\d{2}\s*$/.test(line)) {
      const amount = parseMoney(line);
      if (amount != null && amount > 0) candidates.push(amount);
    }
  }

  if (!candidates.length) return null;

  const nonCash = candidates.filter((amount) => amount < 19.5);
  if (nonCash.length) return nonCash[nonCash.length - 1];
  return candidates[candidates.length - 1];
}

function extractTotal(
  lines: string[]
): {
  value: number;
  confidence: "high" | "medium" | "low";
} {
  const printedTotal = findPrintedReceiptTotal(lines);
  if (printedTotal != null) {
    return { value: printedTotal, confidence: "high" };
  }

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (isOcrGarbageLine(line)) continue;
    if (isSubtotalLine(line) || isTaxLine(line) || isDiscountLine(line)) continue;
    if (/^totaal\b/i.test(line)) {
      const amount =
        amountOnSameOrNextLine(lines, i) ?? amountNearTotaalLabel(lines, i);
      if (amount != null && amount > 0) {
        return { value: amount, confidence: "high" };
      }
    }
  }

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (isOcrGarbageLine(line)) continue;
    if (isSubtotalLine(line) || isTaxLine(line) || isDiscountLine(line)) continue;
    if (/^(?:total|te betalen|amount due|genel toplam|toplam)\b/i.test(line)) {
      const amount = amountOnSameOrNextLine(lines, i);
      if (amount != null && amount > 0) {
        return { value: amount, confidence: "high" };
      }
    }
  }

  const footer = lines.slice(Math.max(0, lines.length - 24));
  const candidates: { value: number; score: number }[] = [];

  for (let i = footer.length - 1; i >= 0; i--) {
    const line = footer[i].trim();
    const lower = line.toLowerCase();

    if (isSubtotalLine(line) || isTaxLine(line) || isDiscountLine(line)) continue;

    if (/^(?:totaal|total|te betalen|amount due|genel toplam|toplam)\b/i.test(lower)) {
      const amount = amountOnSameOrNextLine(footer, i);
      if (amount != null && amount > 0) {
        candidates.push({ value: amount, score: 100 });
      }
    }
  }

  if (candidates.length) {
    candidates.sort((a, b) => b.score - a.score);
    return { value: candidates[0].value, confidence: "high" };
  }

  for (let i = footer.length - 1; i >= 0; i--) {
    const line = footer[i];
    if (!isGrandTotalLine(line)) continue;
    const amount = amountOnSameOrNextLine(footer, i);
    if (amount != null && amount > 0) {
      return { value: amount, confidence: "high" };
    }
  }

  const parsedProducts = lines
    .map((line) => parseProductLine(line))
    .filter((line): line is ReceiptLineDraft => line != null);
  const linesSum = sumReceiptLines(parsedProducts);

  const subtotalAmount = footer
    .filter((line) => isSubtotalLine(line))
    .map((line) => extractMoneyFromLine(line))
    .find((amount) => amount != null && amount > 0);

  const taxSum = sumTaxAmounts(footer);
  if (subtotalAmount != null && taxSum > 0) {
    return {
      value: Math.round((subtotalAmount + taxSum) * 100) / 100,
      confidence: "medium",
    };
  }

  const nonTaxAmounts = footer
    .filter(
      (line) =>
        !isOcrGarbageLine(line) &&
        !isTaxLine(line) &&
        !isSubtotalLine(line) &&
        !isDiscountLine(line) &&
        !/^(?:betaald|paid|pin|bedankt|thank)\b/i.test(line.trim())
    )
    .map((line) => extractMoneyFromLine(line))
    .filter((n): n is number => n != null && n > 0);

  const paymentLike = (amount: number) =>
    amount >= 19.5 && Number.isInteger(amount);

  const receiptAmounts = nonTaxAmounts.filter((amount) => !paymentLike(amount));

  if (receiptAmounts.length) {
    if (linesSum > 0) {
      const aboveSubtotal = receiptAmounts.filter(
        (amount) => amount >= linesSum * 0.98
      );
      if (aboveSubtotal.length) {
        return {
          value: Math.max(...aboveSubtotal),
          confidence: "medium",
        };
      }
    }

    return {
      value: Math.max(...receiptAmounts),
      confidence: "medium",
    };
  }

  return { value: 0, confidence: "low" };
}

export function sumReceiptLines(
  lines: Pick<ReceiptLineDraft, "totalAmount">[]
): number {
  return lines.reduce((sum, line) => sum + (line.totalAmount ?? 0), 0);
}

function looksLikePersonName(line: string): boolean {
  const words = line.trim().split(/\s+/);
  if (words.length < 2 || words.length > 3) return false;
  if (/\d/.test(line)) return false;
  if (FUEL_BRAND_IN_TEXT.test(line) || GROCERY_BRAND_IN_TEXT.test(line)) {
    return false;
  }
  return words.every((word) => /^[A-Za-zÀ-ÿİıŞşĞğÜüÖö'-]{2,}$/.test(word));
}

function looksLikeLocation(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 35) return false;
  if (/\d/.test(trimmed)) return false;
  if (
    STORE_SKIP.test(trimmed) ||
    STORE_HEADER_NOISE.test(trimmed) ||
    NL_POSTCODE.test(trimmed)
  ) {
    return false;
  }
  if (
    /^(shell|bp|tinq|euro|diesel|benzin|total|subtotal|totaal|toplam|vat|btw|kdv)/i.test(
      trimmed
    )
  ) {
    return false;
  }
  return /^[A-Za-zÀ-ÿİıŞşĞğÜüÖö]/.test(trimmed);
}

const GROCERY_BRAND_IN_TEXT =
  /\b(jumbo|albert heijn|lidl|aldi|migros|bim|a101|carrefour|plus|dirk|coop|spar)\b/i;

function lineMatchesKnownStore(line: string, known: string): boolean {
  const trimmed = line.trim();
  const lower = trimmed.toLowerCase();

  if (/\d+[.,]\d{2}\s*$/.test(trimmed)) return false;

  if (known === "ah") {
    return (
      lower.includes("albert heijn") || /^ah(?:[\s.-]+\d+)?$/i.test(trimmed)
    );
  }

  return lower.includes(known);
}

function findKnownStoreLine(lines: string[]): number {
  const knownByLength = [...KNOWN_STORES].sort((a, b) => b.length - a.length);

  for (let i = 0; i < lines.length; i++) {
    for (const known of knownByLength) {
      if (lineMatchesKnownStore(lines[i], known)) return i;
    }
  }
  return -1;
}

function buildStoreFromBrandLine(lines: string[], brandIdx: number): string {
  const brandLine = lines[brandIdx].trim();
  const words = brandLine.split(/\s+/);

  if (words.length >= 2) {
    return titleCase(brandLine);
  }

  if (FUEL_BRAND_IN_TEXT.test(brandLine)) {
    for (let j = brandIdx + 1; j < Math.min(brandIdx + 4, lines.length); j++) {
      if (looksLikeLocation(lines[j])) {
        return `${titleCase(brandLine)} ${titleCase(lines[j])}`;
      }
    }
  }

  return titleCase(brandLine);
}

function extractStoreName(lines: string[]): {
  value: string;
  confidence: "high" | "medium" | "low";
} {
  const brandIdx = findKnownStoreLine(lines);
  if (brandIdx >= 0) {
    return {
      value: buildStoreFromBrandLine(lines, brandIdx),
      confidence: "high",
    };
  }

  const inferred = inferStoreFromProductLines(lines);
  if (inferred) {
    return { value: inferred, confidence: "medium" };
  }

  const head = lines.slice(0, 12);
  for (const line of head) {
    if (line.length < 3 || line.length > 40) continue;
    if (STORE_SKIP.test(line) || STORE_HEADER_NOISE.test(line)) continue;
    if (isReceiptColumnHeader(line)) continue;
    if (NL_POSTCODE.test(line)) continue;
    if (/^\d+[.,]?\d*$/.test(line)) continue;
    if (/^\d+\s/.test(line)) continue;
    if (looksLikePersonName(line)) continue;
    return { value: titleCase(line), confidence: "medium" };
  }

  return { value: "Store", confidence: "low" };
}

function cleanProductName(name: string): string {
  return name
    .replace(/\s*€\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Keep OCR product spelling; do not translate or title-case. */
function preserveProductName(name: string): string {
  return cleanProductName(name);
}

function titleCase(input: string): string {
  return cleanProductName(input)
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

const SCATTERED_LINE_SKIP =
  /^(?:\d+|aantal|omschri|omscri|jving|bonus|terug|btw|subtotaal|totaal|jouw|jou\s|voordeel|voordel|betaald|contant|over|eur|waarvan|box|prijs|bedrag|valburg|heijn|elst|driessen|weg|lekk|open|terug|nr\.?|0481|8770|15:18|10-04|ma t|zo \d|leuk|lang|voor u)/i;

const SCATTERED_PRODUCT_NAME =
  /^(?:AH\s+(?!BONUS)[A-Z][A-Za-z\s]{2,}|DRUI\s*VEN|DRUIVEN|MANDARI\s*JNEN|MANDARIJNEN)$/i;

const LINE_SKIP =
  /^(total|totaal|toplam|subtotal|subtotaal|sub-total|aratoplam|ara toplam|btw|vat|kdv|tax|vergi|mwst|belasting|cash|card|pin|bedankt|thank|change|visa|master|maestro|iban|kvk|date|tarih|bon|receipt|fiscaal|amount|paid|betaald|nakit|kredi|indirim|discount|para üstü|para ustu|te betalen|amount due|grand total|genel toplam|wisselgeld|contactless|contactloos|contant|terminal|auth|aid|tid|mid|rrn|batch|loyalty|klantenkaart|bonuskaart|spaarpunten|punt|points|member|customer|klant|copy|kopie|artikel|items|aantal|qty|quantity|prijs|price|bedrag|excl|incl|netto|bruto|jouw|voordeel|korting|besparing|bonus|spaaractie)/i;

const FOOTER_START =
  /^(total|totaal|toplam|subtotal|subtotaal|sub-total|te betalen|amount due|grand total|genel toplam|btw|vat|kdv|betaald|paid|pin\b|maestro|visa|mastercard|contactless|contactloos|contant|cash|wisselgeld|change|bedankt|thank|bon einde|einde bon|jouw|voordeel|korting|besparing|bonus)/i;

const EAN_LINE = /^\d{8,14}$/;

const LINE_AMOUNT_PATTERNS = [
  /^(\d+)\s+(.+?)\s+(\d+[.,]\d{2})\s*(?:TL|₺|EUR)?\s*$/i,
  /^(\d+)\s*[x×@]\s*(.+?)\s+(\d+[.,]\d{2})\s*(?:TL|₺|EUR)?\s*$/i,
  /^(\d+)\s*ADET\s+(.+?)\s+(\d+[.,]\d{2})\s*(?:TL|₺)?\s*$/i,
  /^(.+?)\s+(\d+[.,]\d{2})\s*(?:TL|₺)\s*$/i,
  /^(.+?)\s+€\s*(\d+[.,]\d{2})\s*[A-Za-z]?\s*$/i,
  /^(.+?)\s+(\d+[.,]\d{2})\s*(?:EUR|TL|₺)?\s*[A-Za-z]?\s*$/,
  /^(.+?)\s{2,}(\d+[.,]\d{2})\s*[A-Za-z]?\s*$/,
  /^(.+?)\t+(\d+[.,]\d{2})\s*$/,
  /^(\d+[.,]\d{2})\s+(.+)$/,
];

function isDutchTableProductLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    /^\d+\s+.+\s+\d+[.,]\d{2}(?:\s+\d+[.,]\d{2})?/i.test(trimmed) ||
    /^(?:AH|JUMBO|PLUS|LIDL|ALDI)\s+.+\s+\d+[.,]\d{2}/i.test(trimmed) ||
    /^[A-Za-z].+\s+\d+[.,]\d{2}(?:\s+\d+[.,]\d{2})?\s*[A-Za-z]?\s*$/i.test(
      trimmed
    )
  );
}

function looksLikeProductLine(line: string): boolean {
  if (LINE_SKIP.test(line) || EAN_LINE.test(line)) return false;
  if (isReceiptColumnHeader(line)) return false;
  if (/^\d{8,}\s/.test(line)) return false;
  if (isDutchTableProductLine(line)) return true;
  return LINE_AMOUNT_PATTERNS.some((pattern) => pattern.test(line));
}

function findLineItemsStart(lines: string[]): number {
  for (let i = 0; i < Math.min(lines.length, 18); i++) {
    if (looksLikeProductLine(lines[i])) return i;
  }
  return Math.min(3, lines.length);
}

function findLineItemsEnd(lines: string[], startIdx: number): number {
  for (let i = startIdx; i < lines.length; i++) {
    if (FOOTER_START.test(lines[i])) return i;
  }
  return lines.length;
}

function isWeakFooterLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    /^bonus$/i.test(trimmed) ||
    /^btw$/i.test(trimmed) ||
    /^totaal$/i.test(trimmed) ||
    /^jouw\s*voordeel$/i.test(trimmed) ||
    /^jou\s*voordeel$/i.test(trimmed)
  );
}

function findFooterStart(lines: string[]): number {
  const strongFooter =
    /^(subtotaal|betaald met:|contant|wisselgeld|bedankt|bon einde|einde bon)/i;
  for (let i = 0; i < lines.length; i++) {
    if (strongFooter.test(lines[i].trim())) return i;
  }

  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (!/^totaal\b/i.test(trimmed) || isSubtotalLine(trimmed)) continue;
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
      if (parseStandaloneMoneyLine(lines[j]) != null) return i;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (isSubtotalLine(trimmed)) return i;
    if (isWeakFooterLine(trimmed)) continue;
    if (FOOTER_START.test(trimmed)) return i;
  }
  return lines.length;
}

function isSkippableNonProductLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (looksLikeProductLine(trimmed)) return false;
  if (isReceiptColumnHeader(trimmed)) return true;
  if (isSubtotalLine(trimmed) || isTaxLine(trimmed) || isDiscountLine(trimmed)) {
    return true;
  }
  if (FOOTER_START.test(trimmed)) return true;
  if (STORE_SKIP.test(trimmed) || STORE_HEADER_NOISE.test(trimmed)) return true;
  if (NL_POSTCODE.test(trimmed)) return true;
  if (EAN_LINE.test(trimmed)) return true;
  if (findKnownStoreLine([trimmed]) >= 0) return true;
  if (/^(?:datum|date|tarih|bon|kass|medewerker|filiaal|winkel|klant|customer)\b/i.test(trimmed)) {
    return true;
  }
  if (/^\d{2}[./-]\d{2}[./-]\d{2,4}(?:\s+\d{1,2}:\d{2})?$/.test(trimmed)) {
    return true;
  }
  return false;
}

function normalizeTableLine(line: string): string {
  return line
    .trim()
    .replace(/\s+[A-Za-z]\s*$/, "")
    .replace(/(\d+[.,]\d{2})[A-Za-z]\s*$/i, "$1");
}

function dedupeLineItems(items: ReceiptLineDraft[]): ReceiptLineDraft[] {
  const seen = new Set<string>();
  const unique: ReceiptLineDraft[] = [];

  for (const item of items) {
    const key = `${item.name.toLowerCase()}|${item.totalAmount ?? 0}|${item.quantity ?? 1}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  return unique;
}

function parseDutchTableProductLine(line: string): ReceiptLineDraft | null {
  const trimmed = normalizeTableLine(line);

  const fullMatch = trimmed.match(
    /^(\d+)\s+(.+?)\s+(\d+[.,]\d{2})\s+(\d+[.,]\d{2})\s*$/i
  );
  if (fullMatch) {
    const quantity = Number(fullMatch[1]);
    const name = fullMatch[2].trim();
    const unitPrice = parseMoney(fullMatch[3]);
    const totalAmount = parseMoney(fullMatch[4]);

    if (!isValidProductName(name) || !totalAmount || totalAmount <= 0) return null;

    return {
      name: preserveProductName(name),
      quantity: quantity > 0 ? quantity : 1,
      totalAmount,
      unitPrice:
        unitPrice && unitPrice > 0
          ? unitPrice
          : totalAmount / (quantity > 0 ? quantity : 1),
    };
  }

  const brandDoublePriceMatch = trimmed.match(
    /^((?:AH|JUMBO|PLUS|LIDL|ALDI)\s+.+?)\s+(\d+[.,]\d{2})\s+(\d+[.,]\d{2})\s*[A-Za-z]?\s*$/i
  );
  if (brandDoublePriceMatch) {
    const name = brandDoublePriceMatch[1].trim();
    const unitPrice = parseMoney(brandDoublePriceMatch[2]);
    const totalAmount = parseMoney(brandDoublePriceMatch[3]);
    if (!isValidProductName(name) || !totalAmount || totalAmount <= 0) return null;
    return {
      name: preserveProductName(name),
      quantity: 1,
      totalAmount,
      unitPrice: unitPrice && unitPrice > 0 ? unitPrice : totalAmount,
    };
  }

  const qtySinglePriceMatch = trimmed.match(
    /^(\d+)\s+(.+?[A-Za-z].+?)\s+(\d+[.,]\d{2})\s*$/i
  );
  if (qtySinglePriceMatch) {
    const quantity = Number(qtySinglePriceMatch[1]);
    const name = qtySinglePriceMatch[2].trim();
    const totalAmount = parseMoney(qtySinglePriceMatch[3]);

    if (!isValidProductName(name) || !totalAmount || totalAmount <= 0) return null;

    return {
      name: preserveProductName(name),
      quantity: quantity > 0 ? quantity : 1,
      totalAmount,
      unitPrice: totalAmount / (quantity > 0 ? quantity : 1),
    };
  }

  const nameOnlyMatch = trimmed.match(/^([A-Za-z].+?)\s+(\d+[.,]\d{2})\s*$/i);
  if (nameOnlyMatch && !/^(?:sub|totaal|total|btw|vat|jouw|voordeel)/i.test(nameOnlyMatch[1])) {
    const name = nameOnlyMatch[1].trim();
    const totalAmount = parseMoney(nameOnlyMatch[2]);
    if (isValidProductName(name) && totalAmount != null && totalAmount > 0) {
      return {
        name: preserveProductName(name),
        quantity: 1,
        totalAmount,
        unitPrice: totalAmount,
      };
    }
  }

  return null;
}

function parseProductLine(line: string): ReceiptLineDraft | null {
  if (isOcrGarbageLine(line)) return null;
  if (LINE_SKIP.test(line) || EAN_LINE.test(line)) return null;
  if (isReceiptColumnHeader(line)) return null;
  if (isTaxLine(line) || isSubtotalLine(line) || isDiscountLine(line)) return null;
  if (/^[A-Za-z]\s*$/.test(line.trim())) return null;
  if (line.length < 4) return null;
  if (/^\d{8,}\s/.test(line)) return null;
  if (/^(btw|vat|kdv|tax|vergi|mwst)\s*\d/i.test(line.trim())) return null;

  const tableLine = parseDutchTableProductLine(line);
  if (tableLine) return tableLine;

  const qtyPatterns = [
    /^(\d+)\s+(.+?)\s+(\d+[.,]\d{2})\s*(?:TL|₺|EUR)?\s*$/i,
    /^(\d+)\s*[x×@]\s*(.+?)\s+(\d+[.,]\d{2})\s*(?:TL|₺|EUR)?\s*$/i,
    /^(\d+)\s*ADET\s+(.+?)\s+(\d+[.,]\d{2})\s*(?:TL|₺)?\s*$/i,
  ];

  for (const pattern of qtyPatterns) {
    const match = line.match(pattern);
    if (!match) continue;
    const quantity = Number(match[1]);
    const name = match[2].trim();
    const totalAmount = parseMoney(match[3]);
    if (isValidProductName(name) && totalAmount != null && totalAmount > 0) {
      return {
        name: preserveProductName(name),
        quantity,
        totalAmount,
        unitPrice: totalAmount / quantity,
      };
    }
  }

  const weightedMatch = /\bkg\b/i.test(line)
    ? line.match(
        /^(?:(\d+[.,]\d{2,3})\s*kg\s+)?((?:AH|JUMBO|PLUS|LIDL|ALDI)\s+.+?|.+?)\s+(?:(\d+[.,]\d{2,3})\s*kg\s+)?(\d+[.,]\d{2})\s*$/i
      )
    : null;
  if (weightedMatch) {
    const leadingKg = weightedMatch[1]
      ? Number(weightedMatch[1].replace(",", "."))
      : null;
    const trailingKg = weightedMatch[3]
      ? Number(weightedMatch[3].replace(",", "."))
      : null;
    const name = weightedMatch[2]
      .trim()
      .replace(/\s+\d+[.,]\d{2,3}\s*kg\s*$/i, "");
    const totalAmount = parseMoney(weightedMatch[4]);
    const quantity = leadingKg ?? trailingKg;

    if (
      isValidProductName(name) &&
      totalAmount != null &&
      totalAmount > 0 &&
      quantity != null &&
      quantity > 0
    ) {
      return {
        name: preserveProductName(name),
        quantity,
        unit: "kg",
        totalAmount,
        unitPrice: totalAmount / quantity,
      };
    }
  }

  const kgMatch = line.match(
    /^(.+?)\s+(\d+[.,]\d{2,3})\s*kg(?:\s+[x×@]\s*(\d+[.,]\d{2}))?\s*(\d+[.,]\d{2})?\s*$/i
  );
  if (kgMatch) {
    const name = kgMatch[1].trim();
    const quantity = Number(kgMatch[2].replace(",", "."));
    const inlinePrice = kgMatch[3] ? parseMoney(kgMatch[3]) : null;
    const totalAmount = parseMoney(kgMatch[4] ?? "") ?? inlinePrice;
    if (
      isValidProductName(name) &&
      quantity > 0 &&
      totalAmount != null &&
      totalAmount > 0
    ) {
      return {
        name: preserveProductName(name),
        quantity,
        unit: "kg",
        totalAmount,
        unitPrice: totalAmount / quantity,
      };
    }
  }

  if (!/^\d+\s+[A-Za-zÀ-ÿ]/.test(line.trim())) {
    const amountFirst = line.match(/^(\d+[.,]\d{2})\s+(.+)$/);
    if (amountFirst) {
      const totalAmount = parseMoney(amountFirst[1]);
      const name = amountFirst[2].replace(/\s+/g, " ").trim();
      if (isValidProductName(name) && totalAmount != null && totalAmount > 0) {
        return {
          name: preserveProductName(name),
          quantity: 1,
          totalAmount,
          unitPrice: totalAmount,
        };
      }
    }
  }

  for (const pattern of LINE_AMOUNT_PATTERNS) {
    const match = line.match(pattern);
    if (!match) continue;

    const name = match[1].replace(/\s+/g, " ").trim();
    const totalAmount = parseMoney(match[2]);
    if (!name || totalAmount == null || totalAmount <= 0) continue;
    if (/^\d+[.,]?\d*$/.test(name)) continue;
    if (!isValidProductName(name)) continue;

    return {
      name: preserveProductName(name),
      quantity: 1,
      totalAmount,
      unitPrice: totalAmount,
    };
  }

  return null;
}

function extractLineItems(lines: string[]): ReceiptLineDraft[] {
  const headerIdx = lines.findIndex((line) => isReceiptColumnHeader(line));
  const footerIdx = findFooterStart(lines);
  const startIdx =
    headerIdx >= 0 ? headerIdx + 1 : findLineItemsStart(lines);
  const endIdx = Math.min(findLineItemsEnd(lines, startIdx), footerIdx);
  const items: ReceiptLineDraft[] = [];

  if (headerIdx > 0) {
    for (const line of lines.slice(0, headerIdx)) {
      if (isSkippableNonProductLine(line)) continue;
      const parsed = parseProductLine(line);
      if (parsed) items.push(parsed);
    }
  }

  for (const line of lines.slice(startIdx, endIdx)) {
    const parsed = parseProductLine(line);
    if (parsed) items.push(parsed);
  }

  if (items.length === 0) {
    for (const line of lines.slice(startIdx, endIdx)) {
      if (isReceiptColumnHeader(line) || isDiscountLine(line)) continue;
      const money = extractMoneyFromLine(line);
      if (money == null) continue;
      const name = line.replace(/\d+[.,]\d{2}/g, "").replace(/€/g, "").trim();
      if (isValidProductName(name)) {
        items.push({
          name: preserveProductName(name),
          quantity: 1,
          totalAmount: money,
          unitPrice: money,
        });
      }
    }
  }

  if (items.length === 0) {
    for (const line of lines.slice(0, footerIdx)) {
      if (isSkippableNonProductLine(line)) continue;
      const parsed = parseProductLine(line);
      if (parsed) items.push(parsed);
    }
  }

  let result = dedupeLineItems(items);

  const ahProducts = extractAhProductsFromText(lines.join("\n"));
  if (ahProducts.length > result.length) {
    result = ahProducts;
  } else if (result.length === 0) {
    result = ahProducts;
  }

  if (result.length === 0) {
    result = extractBrandProductsFromText(lines.join("\n"));
  }

  const scattered = extractScatteredGroceryProducts(lines);
  if (looksLikeScrambledAhReceipt(lines, scattered)) {
    result = scattered;
  } else if (result.length === 0) {
    result = scattered;
  }

  if (result.length === 0) {
    const subtotalAmount = lines
      .filter((line) => isSubtotalLine(line))
      .map((line) => extractMoneyFromLine(line))
      .find((amount) => amount != null && amount > 0);
    result = extractNameOnlyProducts(lines, footerIdx, subtotalAmount ?? null);
  }

  return result.slice(0, MAX_RECEIPT_LINE_ITEMS);
}

function looksLikeScrambledAhReceipt(
  lines: string[],
  scattered: ReceiptLineDraft[]
): boolean {
  if (scattered.length < 2) return false;
  const productNames = lines.filter((line) => isScatteredProductNameLine(line));
  const hasScatteredPrices = lines.some(
    (line) => /xx\d/i.test(line) || /\d+[.,]\d{2}\s*B\b/i.test(line)
  );
  return productNames.length >= 2 && hasScatteredPrices;
}

function isScatteredProductNameLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 4) return false;
  if (SCATTERED_LINE_SKIP.test(trimmed)) return false;
  if (/^BONUS\s/i.test(trimmed)) return false;
  if (isOcrGarbageLine(trimmed)) return false;
  if (/^[\d.,:\s+\-]+$/.test(trimmed)) return false;
  if (/^XX\d/i.test(trimmed)) return false;
  if (/^[-+]?\d+[.,]\d{2}$/.test(trimmed)) return false;
  if (/^AH\s+BONUS/i.test(trimmed)) return false;
  if (/prijs|bedrag|omschri|jving|voordeel|voordel/i.test(trimmed)) return false;
  const compact = trimmed.replace(/\s/g, "");
  if (/^AH(?:DIVERSE|MANDARI|BONUS)/i.test(compact)) return false;

  return SCATTERED_PRODUCT_NAME.test(trimmed.replace(/\s+/g, " "));
}

function extractScatteredPriceBlock(
  lines: string[],
  productCount: number
): number[] {
  const bedrags: number[] = [];
  let leadingUnit: number | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (isScatteredProductNameLine(trimmed)) continue;
    if (!/xx\d/i.test(trimmed) && !/\d+[.,]\d{2}\s*B\b/i.test(trimmed)) {
      continue;
    }

    const multiB = trimmed.match(/(\d+[.,]\d{2})\s+(\d+[.,]\d{2})\s*B\b/i);
    if (multiB) {
      if (leadingUnit == null) {
        leadingUnit = parseMoney(multiB[1])!;
      }
      bedrags.push(parseMoney(multiB[2])!);
      continue;
    }

    const bMatch = trimmed.match(/(\d+[.,]\d{2})\s*B\b/i);
    if (bMatch) {
      bedrags.push(parseMoney(bMatch[1])!);
    }
  }

  if (
    productCount >= 3 &&
    leadingUnit != null &&
    bedrags.length >= 2 &&
    bedrags.length < productCount
  ) {
    return [leadingUnit, ...bedrags.slice(0, productCount - 1)];
  }

  return bedrags.slice(0, productCount);
}

function extractScatteredGroceryProducts(lines: string[]): ReceiptLineDraft[] {
  const entries: { index: number; name: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!isScatteredProductNameLine(line)) continue;
    entries.push({ index: i, name: preserveProductName(line) });
  }

  const seen = new Set<string>();
  const unique: { index: number; name: string }[] = [];
  for (const entry of entries) {
    const key = entry.name.toLowerCase().replace(/\s+/g, "");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(entry);
  }

  if (!unique.length) return [];

  const prices = extractScatteredPriceBlock(lines, unique.length);

  return unique.map((entry, index) => ({
    name: entry.name,
    quantity: 1,
    totalAmount: prices[index] ?? 0,
    unitPrice: prices[index] ?? 0,
  }));
}

function extractAhProductsFromText(text: string): ReceiptLineDraft[] {
  const items: ReceiptLineDraft[] = [];
  const pattern =
    /(?:^|\n)\s*(?:(\d+)[ \t]+)?(AH[ \t]+[A-Z0-9][A-Z0-9 \t.'\-/]{2,48}?)(?:[ \t]+(?:€[ \t]*)?(\d+[.,]\d{2}))?(?:[ \t]+(?:€[ \t]*)?(\d+[.,]\d{2}))?[ \t]*[A-Za-z]?(?=\n|$)/gi;

  for (const match of text.matchAll(pattern)) {
    const quantity = match[1] ? Number(match[1]) : 1;
    const name = match[2].trim();
    const firstPrice = match[3] ? parseMoney(match[3]) : null;
    const secondPrice = match[4] ? parseMoney(match[4]) : null;
    const totalAmount = secondPrice ?? firstPrice;

    if (!isValidProductName(name) || !totalAmount || totalAmount <= 0) continue;

    items.push({
      name: preserveProductName(name),
      quantity: quantity > 0 ? quantity : 1,
      totalAmount,
      unitPrice:
        firstPrice && secondPrice
          ? firstPrice
          : totalAmount / (quantity > 0 ? quantity : 1),
    });
  }

  return dedupeLineItems(items);
}

function extractBrandProductsFromText(text: string): ReceiptLineDraft[] {
  const items: ReceiptLineDraft[] = [];
  const patterns = [
    /(?:^|\n)\s*(?:(\d+)[ \t]+)?((?:JUMBO|PLUS|LIDL|ALDI)[ \t]+[A-Z0-9][A-Z0-9 \t.'\-/]{1,48}?)[ \t]+(?:€[ \t]*)?(\d+[.,]\d{2})(?:[ \t]+(?:€[ \t]*)?(\d+[.,]\d{2}))?[ \t]*[A-Za-z]?(?=\n|$)/gi,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const quantity = match[1] ? Number(match[1]) : 1;
      const name = match[2].trim();
      const firstPrice = parseMoney(match[3]);
      const secondPrice = match[4] ? parseMoney(match[4]) : null;
      const totalAmount = secondPrice ?? firstPrice;
      const unitPrice = secondPrice ? firstPrice : firstPrice;

      if (!isValidProductName(name) || !totalAmount || totalAmount <= 0) continue;
      if (/^(?:btw|vat|kdv|sub|totaal|total|jouw|voordeel|korting|bedrag|prijs|aantal)/i.test(name)) {
        continue;
      }

      items.push({
        name: preserveProductName(name),
        quantity: quantity > 0 ? quantity : 1,
        totalAmount,
        unitPrice:
          unitPrice && unitPrice > 0
            ? unitPrice
            : totalAmount / (quantity > 0 ? quantity : 1),
      });
    }
  }

  return dedupeLineItems(items);
}

function looksLikeProductNameOnlyLine(line: string): boolean {
  const trimmed = normalizeTableLine(line);
  if (isSkippableNonProductLine(trimmed)) return false;
  if (extractMoneyFromLine(trimmed) != null) return false;
  if (/^(?:\d+[ \t]+)?(?:AH|JUMBO|PLUS|LIDL|ALDI)[ \t]+[A-Za-z]/i.test(trimmed)) {
    return true;
  }
  if (/^\d+[ \t]+[A-Za-zÀ-ÿ]{3,}/.test(trimmed)) return true;
  if (/^(?:sub|totaal|total|btw|vat|jouw|voordeel|bedrag|prijs|aantal)/i.test(trimmed)) {
    return false;
  }
  return (
    /^[A-Z0-9][A-Z0-9 \t.'\-/]{3,}$/.test(trimmed) &&
    /[A-Z]{2,}/.test(trimmed)
  );
}

function extractNameOnlyProducts(
  lines: string[],
  footerIdx: number,
  subtotal: number | null
): ReceiptLineDraft[] {
  const names: string[] = [];

  for (const line of lines.slice(0, footerIdx)) {
    if (!looksLikeProductNameOnlyLine(line)) continue;
    const name = line.replace(/^\d+\s+/, "").trim();
    if (isValidProductName(name)) names.push(name);
  }

  const uniqueNames = [...new Set(names.map((n) => n.toLowerCase()))].map(
    (lower) => names.find((n) => n.toLowerCase() === lower)!
  );

  if (uniqueNames.length === 0) return [];

  if (uniqueNames.length === 1 && subtotal != null && subtotal > 0) {
    return [
      {
        name: preserveProductName(uniqueNames[0]),
        quantity: 1,
        totalAmount: subtotal,
        unitPrice: subtotal,
      },
    ];
  }

  return uniqueNames.map((name) => ({
        name: preserveProductName(name),
    quantity: 1,
    totalAmount: 0,
    unitPrice: 0,
  }));
}

function detectCurrency(text: string): string {
  if (/€|EUR/i.test(text)) return "EUR";
  if (/₺|TRY|TL/i.test(text)) return "TRY";
  if (/\$|USD/i.test(text)) return "USD";
  if (/£|GBP/i.test(text)) return "GBP";
  return "EUR";
}

export function parseReceiptText(rawText: string): ParseReceiptResult {
  const normalized = preprocessReceiptText(rawText).trim();
  const lines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const store = extractStoreName(lines);
  const date = extractDate(normalized);
  const total = extractTotal(lines);
  const currency = detectCurrency(normalized);

  let receiptLines = extractLineItems(lines);
  if (isFuelReceipt(normalized, store.value)) {
    const fuelLine = extractFuelLineItem(
      normalized,
      total.value,
      store.value
    );
    if (fuelLine) receiptLines = [fuelLine];
  } else if (receiptLines.length === 0) {
    const fuelLine = extractFuelLineItem(
      normalized,
      total.value,
      store.value
    );
    if (fuelLine) receiptLines = [fuelLine];
  }

  const description = inferReceiptDescription(
    normalized,
    receiptLines,
    store.value
  );
  const suggestedCategory = inferReceiptCategory(
    normalized,
    store.value,
    description
  );

  const draft: ReceiptDraft = {
    rawText: normalized,
    storeName: store.value,
    date: date.value,
    total: total.value,
    currency,
    description,
    suggestedCategory,
    lines: receiptLines,
  };

  return {
    draft,
    hints: {
      store,
      date,
      total,
      currency: { value: currency, confidence: "medium" },
    },
  };
}

export function normalizeStoreName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/hei\s*jn/g, "heijn");
}

const STORE_BRAND_KEYS = [
  "albert heijn",
  "jumbo",
  "lidl",
  "aldi",
  "plus",
  "dirk",
  "coop",
  "spar",
  "migros",
  "carrefour",
  "shell",
  "bp",
  "action",
  "kruidvat",
  "etos",
];

function extractStoreBrandKey(name: string): string | null {
  const normalized = normalizeStoreName(name);
  for (const brand of STORE_BRAND_KEYS) {
    if (normalized.includes(brand)) return brand;
  }
  if (/\bah\b/.test(normalized)) return "albert heijn";
  return null;
}

export function storeNamesMatch(a: string, b: string): boolean {
  const brandA = extractStoreBrandKey(a);
  const brandB = extractStoreBrandKey(b);
  if (brandA && brandB && brandA === brandB) return true;

  const na = normalizeStoreName(a);
  const nb = normalizeStoreName(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}
