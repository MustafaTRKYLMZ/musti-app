import type { ProductPriceSample } from "../types/product";

export type PriceSeriesPoint = {
  date: string;
  unitPrice: number;
  currency?: string;
  storeId?: string;
  storeName?: string;
};

export function buildProductPriceSeries(
  samples: ProductPriceSample[],
  productId: string,
  storeId?: string | null
): PriceSeriesPoint[] {
  return samples
    .filter((s) => s.productId === productId)
    .filter((s) => (storeId ? s.storeId === storeId : true))
    .map((s) => ({
      date: s.date,
      unitPrice: s.unitPrice,
      currency: s.currency,
      storeId: s.storeId,
      storeName: s.storeName,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getProductStoreOptions(
  samples: ProductPriceSample[],
  productId: string
): { storeId: string; storeName: string }[] {
  const map = new Map<string, string>();

  for (const sample of samples) {
    if (sample.productId !== productId || !sample.storeId) continue;
    map.set(sample.storeId, sample.storeName ?? sample.storeId);
  }

  return [...map.entries()]
    .map(([storeId, storeName]) => ({ storeId, storeName }))
    .sort((a, b) => a.storeName.localeCompare(b.storeName));
}
