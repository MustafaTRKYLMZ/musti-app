import dayjs from "dayjs";
import type { Product } from "../types/product";
import type { ProductPriceSample } from "../types/product";

export type ProductSuggestion = {
  productId: string;
  name: string;
  purchaseCount: number;
  lastStoreName?: string;
};

type SuggestInput = {
  products: Product[];
  priceSamples: ProductPriceSample[];
  receiptProductIds?: string[];
  shoppingListProductIds?: string[];
  minPurchases?: number;
  withinDays?: number;
  maxSuggestions?: number;
};

export function suggestFrequentProducts(input: SuggestInput): ProductSuggestion[] {
  const {
    products,
    priceSamples,
    receiptProductIds = [],
    shoppingListProductIds = [],
    minPurchases = 2,
    withinDays = 90,
    maxSuggestions = 6,
  } = input;

  const cutoff = dayjs().subtract(withinDays, "day").format("YYYY-MM-DD");
  const onReceipt = new Set(receiptProductIds);
  const onList = new Set(shoppingListProductIds);

  const counts = new Map<
    string,
    { count: number; lastStoreName?: string; lastDate: string }
  >();

  for (const sample of priceSamples) {
    if (sample.date < cutoff) continue;

    const prev = counts.get(sample.productId);
    const nextCount = (prev?.count ?? 0) + 1;
    const isNewer = !prev || sample.date >= prev.lastDate;

    counts.set(sample.productId, {
      count: nextCount,
      lastStoreName: isNewer ? sample.storeName : prev?.lastStoreName,
      lastDate: isNewer ? sample.date : prev!.lastDate,
    });
  }

  const productById = new Map(products.map((p) => [p.id, p]));

  return [...counts.entries()]
    .filter(([productId, meta]) => {
      if (meta.count < minPurchases) return false;
      if (onReceipt.has(productId)) return false;
      if (onList.has(productId)) return false;
      return productById.has(productId);
    })
    .map(([productId, meta]) => ({
      productId,
      name: productById.get(productId)!.name,
      purchaseCount: meta.count,
      lastStoreName: meta.lastStoreName,
    }))
    .sort((a, b) => b.purchaseCount - a.purchaseCount)
    .slice(0, maxSuggestions);
}
