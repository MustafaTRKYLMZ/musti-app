import type { ReceiptLineDraft } from "../types/receipt";

/** Canonical fuel product name on receipts and in the product catalog. */
export const FUEL_PRODUCT_NAME = "Yakıt";

/** Above this line count, transaction description defaults to store name. */
export const GROCERY_DESCRIPTION_LINE_THRESHOLD = 10;

export const MAX_RECEIPT_LINE_ITEMS = 120;

/** i18n key — translate with t() in UI. */
export const FUEL_TRANSACTION_CATEGORY = "transport";

export const GROCERY_TRANSACTION_CATEGORY = "grocies";

export const FOOD_TRANSACTION_CATEGORY = "food";

export const FUEL_UNIT = "L";

const FUEL_CONTEXT =
  /benzin|diesel|motorin|mazot|yakıt|yakit|euro\s*9|e10|e5|lpg|autogas|tanken|fuel|pompa\s*no|shell|bp\b|tamoil|texaco|omv|q8|avia|tinq|esso|total\s*energies|sunoco|petrol/i;

const GROCERY_STORE =
  /jumbo|albert heijn|\bah\b|lidl|aldi|migros|bim|a101|plus\b|dirk|coop|spar|carrefour/i;

export function isFuelReceipt(text: string, storeName: string): boolean {
  const haystack = `${text}\n${storeName}`.toLowerCase();
  return FUEL_CONTEXT.test(haystack);
}

function extractLiters(text: string): number | undefined {
  const litersMatch = text.match(
    /(\d+[.,]\d{1,3})\s*(?:L|LT|LTR|LITRE|LITER|litre|liter)\b/i
  );
  if (!litersMatch) return undefined;
  const quantity = Number(litersMatch[1].replace(",", "."));
  return quantity > 0 ? quantity : undefined;
}

export function extractFuelLineItem(
  text: string,
  receiptTotal: number,
  storeName = ""
): ReceiptLineDraft | null {
  if (!isFuelReceipt(text, storeName)) return null;

  const liters = extractLiters(text);

  return {
    name: FUEL_PRODUCT_NAME,
    quantity: liters,
    unit: liters ? FUEL_UNIT : undefined,
    totalAmount: receiptTotal,
    unitPrice:
      liters && liters > 0 ? receiptTotal / liters : receiptTotal,
    productCategory: FUEL_PRODUCT_NAME,
  };
}

export function inferReceiptDescription(
  text: string,
  lines: ReceiptLineDraft[],
  storeName: string
): string {
  if (isFuelReceipt(text, storeName)) {
    return FUEL_PRODUCT_NAME;
  }

  if (lines.length >= GROCERY_DESCRIPTION_LINE_THRESHOLD) {
    return storeName;
  }

  if (lines.length === 1) return lines[0].name;
  if (lines.length > 1) {
    const names = lines.slice(0, 2).map((l) => l.name);
    return lines.length > 2 ? `${names.join(", ")}…` : names.join(", ");
  }

  return storeName;
}

export function inferReceiptCategory(
  text: string,
  storeName: string,
  _description: string
): string {
  if (isFuelReceipt(text, storeName)) {
    return FUEL_TRANSACTION_CATEGORY;
  }

  const haystack = `${text}\n${storeName}`.toLowerCase();

  if (GROCERY_STORE.test(haystack)) {
    return GROCERY_TRANSACTION_CATEGORY;
  }

  if (/restaurant|cafe|coffee|starbucks|mcdonald|burger/i.test(haystack)) {
    return FOOD_TRANSACTION_CATEGORY;
  }

  return GROCERY_TRANSACTION_CATEGORY;
}
