import {
  FOOD_TRANSACTION_CATEGORY,
  FUEL_TRANSACTION_CATEGORY,
  GROCERY_TRANSACTION_CATEGORY,
} from "./inferReceiptMetadata";

const CATEGORY_ALIASES: Record<string, string> = {
  groceries: GROCERY_TRANSACTION_CATEGORY,
  grocery: GROCERY_TRANSACTION_CATEGORY,
  grocies: GROCERY_TRANSACTION_CATEGORY,
  "market alışverişi": GROCERY_TRANSACTION_CATEGORY,
  "market alisverisi": GROCERY_TRANSACTION_CATEGORY,
  boodschappen: GROCERY_TRANSACTION_CATEGORY,
  transport: FUEL_TRANSACTION_CATEGORY,
  ulaşım: FUEL_TRANSACTION_CATEGORY,
  ulasim: FUEL_TRANSACTION_CATEGORY,
  vervoer: FUEL_TRANSACTION_CATEGORY,
  food: FOOD_TRANSACTION_CATEGORY,
  yemek: FOOD_TRANSACTION_CATEGORY,
  eten: FOOD_TRANSACTION_CATEGORY,
};

/** Map legacy or localized category labels to canonical i18n keys. */
export function normalizeReceiptCategoryKey(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return GROCERY_TRANSACTION_CATEGORY;

  const lower = trimmed.toLowerCase();
  return CATEGORY_ALIASES[lower] ?? trimmed;
}
