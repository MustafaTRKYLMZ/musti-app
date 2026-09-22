import type { TranslationKey } from "../i18n/translate";
import type { LocalTransaction } from "../types/transaction";
import {
  FOOD_TRANSACTION_CATEGORY,
  FUEL_TRANSACTION_CATEGORY,
  GROCERY_TRANSACTION_CATEGORY,
} from "../receipt/inferReceiptMetadata";
import { normalizeReceiptCategoryKey } from "../receipt/normalizeReceiptCategoryKey";

type TranslateFn = (
  key: TranslationKey,
  params?: Record<string, string | number>
) => string;

export function localizeTransactionCategory(
  raw: string | undefined,
  t: TranslateFn
): string {
  if (!raw?.trim()) return "";
  const key = normalizeReceiptCategoryKey(raw);
  const translated = t(key as TranslationKey);
  return translated !== key ? translated : raw.trim();
}

export function getCategoryIconName(categoryKey: string): string {
  switch (normalizeReceiptCategoryKey(categoryKey)) {
    case GROCERY_TRANSACTION_CATEGORY:
      return "cart-outline";
    case FUEL_TRANSACTION_CATEGORY:
      return "car-outline";
    case FOOD_TRANSACTION_CATEGORY:
      return "restaurant-outline";
    default:
      return "pricetag-outline";
  }
}

export type TransactionCardDisplay = {
  title: string;
  subtitle?: string;
  leadingIcon?: string;
  metaLabel?: string;
};

export function getTransactionCardDisplay(
  tx: Pick<LocalTransaction, "item" | "category" | "storeName">,
  t: TranslateFn
): TransactionCardDisplay {
  const storeName = tx.storeName?.trim() || "";
  const categoryKey = tx.category ? normalizeReceiptCategoryKey(tx.category) : "";
  const localizedCategory = categoryKey
    ? localizeTransactionCategory(tx.category, t)
    : "";
  const hasKnownCategory =
    Boolean(categoryKey) &&
    t(categoryKey as TranslationKey) !== categoryKey;

  if (storeName && hasKnownCategory) {
    return {
      title: localizedCategory,
      subtitle: storeName,
      leadingIcon: "storefront-outline",
    };
  }

  if (hasKnownCategory) {
    const itemDiffers =
      tx.item.trim().length > 0 &&
      tx.item.trim().toLowerCase() !== localizedCategory.toLowerCase();

    return {
      title: localizedCategory,
      subtitle: itemDiffers ? tx.item.trim() : undefined,
      leadingIcon: getCategoryIconName(categoryKey),
    };
  }

  if (storeName) {
    return {
      title: tx.item.trim() || storeName,
      subtitle: tx.item.trim() ? storeName : undefined,
      leadingIcon: "storefront-outline",
    };
  }

  return {
    title: tx.item.trim(),
    metaLabel: tx.category ? localizeTransactionCategory(tx.category, t) : undefined,
  };
}
